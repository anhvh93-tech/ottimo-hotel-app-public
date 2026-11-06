# Từ điển tham số quy tắc – OTTIMO Desk

- Lập: DOM · Round 4 – Sản xuất · 06/11/2026 · Bản 1.0. Sửa: DOM · Round 5 – Sản xuất · 06/11/2026 · Bản 1.1 (mục `night_from_month_divisor` theo QC Round 4 ĐK-6; thêm mục [Sắp có ở v1.0.5](#sap-co-v105)) · Bản 1.2 (tên tiếng Việt của 29 khóa theo UXD V5-21; dạng giá trị `weekend_nights` – BUG-R5-001; `hold_expiry_reminder_hours` = 0) · **Bản 1.3** (Round 5 – Phản hồi & sửa: cảnh báo không lưu `min_stay` và `weekend_nights` tới khi v1.0.5 lên – BUG-R5-003, BUG-R5-001; dạng lưu `min_stay` từ v1.0.5 – V5-25). Sửa: DOM · Round 5 – Review PR #96 · 06/11/2026 · **Bản 1.4** (dòng Giới hạn của 28 khóa: bỏ câu "Desk kiểm đúng dạng khi lưu" ở khóa v1.0.4 chưa kiểm, ghi dạng nhận từ v1.0.5 cho 12 khóa V5-25; `short_stay_max_nights` "đề xuất 29"). Sửa: DOM · Round 5 – Phản hồi & sửa · 07/11/2026 · **Bản 1.5** (`night_from_month_divisor`, dòng Đội đề xuất sau khi #121 gộp – plan ĐK-6)
- Dành cho: chủ đầu tư và quản lý, khi đọc và sửa **Quản trị → Tham số quy tắc** trên Desk.
- Phạm vi: đủ **198 tham số** trong danh mục của Desk (bản v1.0.4 trên production). Bản máy đọc: `product/docs/tham-so-quy-tac.json` (cùng nội dung cho 198 tham số; mục "Sắp có ở v1.0.5" chỉ có ở bản này vì các khóa đó chưa có trên Desk).
- Căn cứ: `business-rules.md` (BR, mục 13), sổ tay vận hành bản 1.10 (v1.0.4, PR #85), `decision-log.md` (ESC-004, 006, 007, 043, 045, 050), hướng dẫn chuyển giá `rounds/round-04/outputs/DOM/inv-price-switch-guide.md`, mã Desk (`paramCatalog.ts`, `ParamDialog.tsx`, `parameters.service.ts`).
- Tài liệu này **không ghi giá trị đang chạy** trên Desk, không ghi tỷ lệ hoa hồng, không ghi thông tin tài khoản ngân hàng. Giá trị đang chạy xem ngay trên Desk, cột **Giá trị**.

## Cách đọc

Mỗi tham số có các dòng:
- **Ý nghĩa**: tham số quyết định điều gì.
- **Đơn vị**: %, VND, số đêm, giờ hh:mm, danh sách…
- **Giới hạn**: Desk từ chối số ngoài khoảng này. **Mặc định**: số Desk dùng khi chưa ai lưu giá trị.
- **Ví dụ**: một ca có số.
- **Ảnh hưởng**: chỗ nào trên Desk, web, mẫu tin, hóa đơn đổi theo. **Đi kèm**: tham số phải xem cùng.
- **Đội đề xuất**: mức theo sổ tay và quyết định của anh/chị, kèm lý do.
- **Lưu ý khi sửa**: đơn cũ có giữ số cũ không, ai sửa được, có cần nhập lại mật khẩu không.

Ký hiệu: **[Bảo mật]** = tham số bảo mật – chỉ sửa khi đội khuyên. **[Chưa dùng]** = bản Desk hiện tại chưa đọc tham số này. **[Đã bỏ]** = không còn tác dụng. [GIẢ ĐỊNH] trong lý do = số tạm, chờ anh/chị xác nhận. [PL] = cần luật sư hoặc kế toán xác nhận.

### Quy tắc chung khi sửa (áp cho mọi tham số)

1. **Quản trị → Tham số quy tắc** → chọn tab nhóm → tìm dòng (tên in đậm, mã khóa in nhỏ bên dưới; tab **Khác** dài, dùng Cmd + F hoặc Ctrl + F gõ mã khóa) → **Sửa**.
2. Ô **Giá trị mới** (dòng dạng danh sách là ô **Giá trị (JSON)**): xóa hết chữ cũ, gõ hoặc dán đúng nội dung. Với ô JSON nên sao chép rồi dán, giữ đủ dấu ngoặc và dấu ngoặc kép.
3. **Hiệu lực từ**: để ngày Desk điền sẵn (hôm nay theo ngày làm việc, đổi lúc 06:00) hoặc chọn ngày sau. Không chọn được ngày đã qua. **Trừ hai dòng ở khung dưới:** tới khi v1.0.5 lên, không lưu hai dòng đó; buộc phải đổi thì chọn ngày mai.
4. **Lý do**: ghi ngắn vì sao đổi. Bấm **Lưu thay đổi**.
5. **Đã lưu thì trong ngày không sửa lại được.** Lỡ sai: lưu lại với **Hiệu lực từ = ngày mai**, hoặc báo đội. Dòng đã lên lịch cho ngày sau mà chưa tới ngày thì **Hủy lịch** được.
6. Thay đổi áp cho đơn, báo giá tạo **sau** ngày hiệu lực. Đơn, báo giá, hợp đồng đã tạo **giữ số cũ** (BR-006).
7. Ai sửa: chủ đầu tư và quản lý sửa tham số vận hành. **Chỉ chủ đầu tư** sửa hạn mức FOC, hoa hồng, VAT, lưu trữ dữ liệu và mọi tham số bảo mật. Chỉ **tài khoản nhận chuyển khoản** phải nhập lại mật khẩu và mã 2 bước.
8. Hai công tắc tắt được ngay trong ngày: `public_booking_requests_enabled` = false (tắt form web) và `public_show_prices` = false (ẩn giá web). Bật lại theo luật thường.
9. Giá đêm, giá tháng của từng căn **không** nằm ở đây mà ở **Quản trị → Danh mục căn**. Đổi giá căn và đổi tham số giá nên làm cùng một lần, nếu không Desk ra số lai.
10. Ô **Giá trị (JSON)** (tham số dạng danh sách): Desk v1.0.4 chưa kiểm dạng khi lưu ở nhiều ô loại này (ví dụ `los_discount`, `early_checkin_tiers`; đội đang rà cùng V5-25). Chọn **Hiệu lực từ** là ngày mai, nhắn đội kiểm trong ngày; sai thì **Hủy lịch** ngay trong ngày lưu. Chỉ đổi số hoặc mã bên trong khối đang có, giữ nguyên tên khóa, dấu ngoặc và kiểu (số không để trong ngoặc kép).

> **Lỗi đang sửa – hai tham số (sửa ở v1.0.5):** Tới khi v1.0.5 lên, không bấm **Lưu thay đổi** ở `weekend_nights` (**Đêm tính là cuối tuần**) và `min_stay` (**Ở tối thiểu**). Buộc phải đổi thì nhắn đội trước, chọn **Hiệu lực từ** là ngày mai để còn **Hủy lịch**. Lỡ lưu thì báo đội ngay, coi là P0. Desk v1.0.4 nhận cả giá trị sai dạng ở hai dòng này. Lưu sai thì Desk không nhận ra đêm cuối tuần (`weekend_nights`), hoặc mọi báo giá và đơn trực tiếp mới báo lỗi (`min_stay`), không gỡ được trong ngày: lỗi kéo dài tới 06:00 hôm sau, khi đội đã lưu lại giá trị đúng cho ngày mai (BUG-R5-001, BUG-R5-003).

## Mục lục

1. [Tham số giá – đọc trước](#gia-doc-truoc)
2. [Nhóm "Giữ chỗ, cọc, hủy" (6 tham số)](#g-booking)
3. [Nhóm "Số người & phụ thu" (4 tham số)](#g-occupancy)
4. [Nhóm "Giờ nhận/trả" (5 tham số)](#g-time)
5. [Nhóm "FOC, hoa hồng, phí kênh" (9 tham số)](#g-money)
6. [Nhóm "Bảo mật" (8 tham số)](#g-security)
7. [Nhóm "Khác" (166 tham số)](#g-other)
8. [Tham số trên production lệch sổ tay](#lech-so-tay)
9. [Sắp có ở v1.0.5 (chưa có trên Desk)](#sap-co-v105)

Trong nhóm **Khác** (Desk gom mọi tham số chưa xếp nhóm vào đây), tham số được chia thêm theo chủ đề để dễ tìm.

<a id="gia-doc-truoc"></a>

## Tham số giá – đọc trước

Những tham số dưới đây làm đổi **số tiền** khách thấy trên báo giá Desk, trên web ottimo.vn (giá ước tính), trên đơn OTA khi lễ tân để trống giá, và trên phiếu thanh toán. Web dùng **cùng** cách tính của Desk, kênh Trực tiếp – không có bảng giá riêng.

**Cách Desk tính một báo giá ngắn ngày (1–29 đêm):**
1. Lấy **giá đêm niêm yết** của căn cho từng đêm (Danh mục căn).
2. Cộng mức tăng cuối tuần (`weekend_uplift_pct`) hoặc ngày đặc biệt (`special_uplift_pct`) nếu đêm đó thuộc diện. Hiện đề xuất cả hai = 0.
3. Trừ giảm theo số đêm (`los_discount`) hoặc mã khách quay lại (`return_guest_pct`), không cộng dồn. Hiện đề xuất không giảm theo số đêm.
4. Làm tròn giá đêm (`rounding.night_rate`).
5. Cộng phụ thu người vượt định mức của căn (`extra_adult_fee`, `child_fee_6_11`) × số đêm.
6. Cọc = `short_stay_deposit_pct` × tiền phòng (bước 1–4, không gồm phụ thu), làm tròn `rounding.deposit`.
7. Kiểm: số đêm ≤ `short_stay_max_nights`, đủ ở tối thiểu (`min_stay`), ngày đến trong `booking_window_days`.

**Ví dụ kiểm nhanh với mức đội đề xuất** (giá đêm Studio 800.000 – gồm City View theo INV 06/11, Premium 1.100.000, Signature 1.300.000):

| Ca | Desk phải ra |
|---|---|
| Studio, đến thứ Sáu, 2 đêm, 2 người lớn | 2 × 800.000 = **1.600.000**; cọc **500.000** |
| Signature 401, đến thứ Hai, 7 đêm, 5 người lớn | 7 × 1.300.000 = 9.100.000 + phụ thu 150.000 × 7 = 1.050.000 → **10.150.000**; cọc **2.700.000**; không có dòng "Đã giảm" |
| Studio, 29 đêm, 2 người lớn | 29 × 800.000 = **23.200.000**; không có khối "So sánh: thuê 1 tháng"; 30 đêm → Desk báo thuê dài hạn |
| Premium 302, 2 đêm thường, 3 người lớn + 1 trẻ 8 tuổi | 2 × 1.100.000 + 150.000 × 2 = **2.500.000**; cọc **700.000** |

Ra 1.840.000 ở ca đầu → mức tăng cuối tuần chưa về 0. Có dòng "Đã giảm 10 %" ở ca hai → `los_discount` chưa về `[]`. Ca ba bị chặn → `short_stay_max_nights` / `long_stay_required_from_nights` chưa đổi.

**Các cặp phải đổi cùng nhau:**
- `short_stay_max_nights` = `long_stay_required_from_nights` − 1 (đề xuất 29 và 30). Đổi `long_stay_required_from_nights` trước, rồi tới `short_stay_max_nights`; `long_stay_compare_from_nights` để cùng 30.
- `special_uplift_pct` với `special_dates` và `min_stay`: đưa mức tăng về 0 **không** bỏ ở tối thiểu 2 đêm và không hoàn cọc ngày lễ – hai việc đó theo danh sách `special_dates`.
- `weekend_uplift_pct` với `weekend_nights`: `weekend_nights` chỉ chọn đêm nào được cộng mức tăng cuối tuần. Ở tối thiểu 2 đêm khi đến thứ Sáu, thứ Bảy nằm riêng trong `min_stay` (danh sách ngày đến của chính nó), không đọc `weekend_nights`. Tới khi v1.0.5 lên, không bấm **Lưu thay đổi** ở `weekend_nights` và `min_stay` (khung ở mục Quy tắc chung).
- `extra_adult_fee` và `child_fee_6_11`: từ 6 tuổi tính như người lớn, nên hai số bằng nhau.
- Giá căn (Danh mục căn) với `ota_base_rate`: nếu có dòng `ota_base_rate` thì mỗi lần đổi giá căn phải đổi dòng này cùng lúc. Không có dòng là ổn.
- `public_show_prices` chỉ bật sau khi đội báo giá web khớp giá Desk.

Tên tiếng Việt trong bảng dưới hiện trên Desk từ v1.0.5 (V5-21). Desk v1.0.4 còn hiện mã khóa: tìm theo mã khóa.

| Mã khóa | Tên trên Desk | Đội đề xuất |
|---|---|---|
| [`weekend_uplift_pct`](#k-weekend-uplift-pct) | Tăng giá đêm cuối tuần | 0 |
| [`weekend_nights`](#k-weekend-nights) | Đêm tính là cuối tuần | ["FRI","SAT"] |
| [`weekend_uplift_channels`](#k-weekend-uplift-channels) | Kênh áp tăng giá cuối tuần | all |
| [`special_uplift_pct`](#k-special-uplift-pct) | Tăng giá ngày đặc biệt | 0 |
| [`special_dates`](#k-special-dates) | Danh sách ngày đặc biệt | Đêm 24/12/2026–01/01/2027; Tết đêm 05–10/02/2027; Giỗ Tổ đêm 16/4/2027; đêm 30/4 và 1/5/2027; đêm 1/9 và 2/9/2027. |
| [`special_uplift_channels`](#k-special-uplift-channels) | Kênh áp tăng giá ngày đặc biệt | all |
| [`los_discount`](#k-los-discount) | Giảm giá theo số đêm ở | [] |
| [`short_stay_max_nights`](#k-short-stay-max-nights) | Đơn ngắn ngày dài nhất | 29 |
| [`long_stay_required_from_nights`](#k-long-stay-required-from-nights) | Bắt buộc thuê dài hạn từ | 30 |
| [`long_stay_compare_from_nights`](#k-long-stay-compare-from-nights) | Hiện so sánh thuê 1 tháng từ | 30 |
| [`extra_adult_fee`](#k-extra-adult-fee) | Phụ thu người lớn vượt định mức (mỗi đêm) | 150.000 |
| [`child_fee_6_11`](#k-child-fee-6-11) | Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm) | 150.000 |
| [`child_free_under_age`](#k-child-free-under-age) | Trẻ miễn phí, không tính số người – dưới | 6 |
| [`adult_from_age`](#k-adult-from-age) | Tính là người lớn từ | 12 |
| [`short_stay_deposit_pct`](#k-short-stay-deposit-pct) | Cọc ngắn ngày | 30 |
| [`rounding.night_rate`](#k-rounding-night-rate) | Làm tròn giá đêm | 1.000 |
| [`rounding.deposit`](#k-rounding-deposit) | Làm tròn tiền cọc | 100.000 |
| [`rounding.monthly_rent`](#k-rounding-monthly-rent) | Làm tròn tiền thuê tháng | 1.000 |
| [`rounding.ota_rate`](#k-rounding-ota-rate) | Làm tròn giá đêm đơn OTA | 1.000 |
| [`ota_base_rate`](#k-ota-base-rate) | Giá gốc riêng cho đơn OTA | Không cần dòng này (để trống). |
| [`rate_floor_pct`](#k-rate-floor-pct) | Giá sàn (% giá gốc) | 70 |
| [`rate_ceiling_pct`](#k-rate-ceiling-pct) | Giá trần (% giá gốc) | 250 |
| [`min_stay`](#k-min-stay) | Ở tối thiểu | 2 đêm khi ngày đến là thứ Sáu, thứ Bảy hoặc ngày đặc biệt; mọi kênh. |
| [`min_stay_orphan_night_exception`](#k-min-stay-orphan-night-exception) | Cho bán đêm lẻ kẹp giữa hai đơn | Bật (true) |
| [`booking_window_days`](#k-booking-window-days) | Nhận đặt trước tối đa | 365 |
| [`return_guest_code`](#k-return-guest-code) | Mã khách quay lại | OTTIMO-BACK5 |
| [`return_guest_pct`](#k-return-guest-pct) | Giảm cho khách quay lại | 5 |
| [`stackable`](#k-stackable) | Cộng dồn mã khách quay lại với giảm theo số đêm | Tắt (false) |
| [`prices_include_vat`](#k-prices-include-vat) | Giá niêm yết đã gồm VAT | Bật (true) |
| [`public_show_prices`](#k-public-show-prices) | Hiện giá ước tính trên web | Bật (INV quyết, đã bật trên production 06/11/2026 sau khi QA LP-v2 F2 báo giá web khớp Desk 4/4 mẫu). Cần tắt gấp (giá sai, bị cào): OWN đặt false ngay – web hết giá, form vẫn chạy. |
| [`web_estimate.open_until`](#k-web-estimate-open-until) | Web hiện giá cho đêm trước ngày | 2027-01-01, gia hạn khi chủ đầu tư chốt giá cho năm 2027. |
| [`early_checkin_tiers`](#k-early-checkin-tiers) | Bậc phụ thu nhận phòng sớm | [{"from":"10:00","to":"11:00","pct":30},{"from":"06:00","to":"10:00","pct":50}] |
| [`late_checkout_tiers`](#k-late-checkout-tiers) | Bậc phụ thu trả phòng muộn | [{"after":"12:00","until":"15:00","pct":30},{"after":"15:00","until":"18:00","pct":50}] |
| [`late_grace_until`](#k-late-grace-until) | Ân hạn trả muộn tới | 12:30 |

Các tham số khác cũng làm đổi tiền nhưng ở bước khác: phí, phạt (`adhoc_cleaning_fee`, `smoking_fee`, `key_card_fee`, `laundry_price_per_kg`, `damage_catalog`), hủy và hoàn (`cancel_policy_direct`, `cancel_peak_no_refund`, `early_departure_refund`), thuê tháng (`lease_terms`, `foreigner_surcharge_pct`, `long_stay_daily_divisor`), đổi căn (`room_move_pricing`), VAT (`vat_rate`). Xem trong từng nhóm.

<a id="g-booking"></a>

## Nhóm "Giữ chỗ, cọc, hủy"

<a id="k-hold-expiry-reminder-hours"></a>
#### `hold_expiry_reminder_hours`

- **Tên trên Desk:** Nhắc trước khi hết hạn giữ chỗ · **Nhóm:** Giữ chỗ, cọc, hủy · **Quy tắc:** BR-303
- **Ý nghĩa:** Báo trước khi giữ chỗ hết hạn bao nhiêu giờ: tin cho người tạo và người chốt giữ chỗ, và dòng **Giữ chỗ sắp hết hạn** ở Cần chú ý. **0 = không nhắc**: không tin, không dòng sắp hết hạn. Hết hạn vẫn như cũ: chưa cọc thì Desk tự hủy, có cọc một phần thì báo đỏ (BR-303).
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 0 đến 24 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 2: giữ chỗ hết 18:00 → nhắc lúc 16:00. 0: không nhắc; 18:00 chưa cọc → Desk tự hủy.
- **Ảnh hưởng:** Mục Cần chú ý, thông báo. **Đi kèm:** `hold_extension_max_hours`
- **Đội đề xuất:** 2 – INV-006 (BR-303).
- **Lưu ý khi sửa:** Không nên đặt 0: dòng Giữ chỗ sắp hết hạn là cách duy nhất quầy thấy trước giữ chỗ do sale, CTV tạo (sale, CTV chưa nhận được tin trên Desk). Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-hold-extension-max-hours"></a>
#### `hold_extension_max_hours`

- **Tên trên Desk:** Gia hạn giữ chỗ tối đa · **Nhóm:** Giữ chỗ, cọc, hủy · **Quy tắc:** BR-303
- **Ý nghĩa:** Được gia hạn giữ chỗ thêm tối đa bao nhiêu giờ (1 lần).
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 0 đến 72 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 24: giữ chỗ hết 18:00 hôm nay → gia hạn tối đa tới 18:00 mai (không quá 12:00 ngày đến).
- **Ảnh hưởng:** Nút gia hạn giữ chỗ. **Đi kèm:** `hold_hours_default`, `hold_latest_time_on_arrival`
- **Đội đề xuất:** 24 – INV-006.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-hold-hours-default"></a>
#### `hold_hours_default`

- **Tên trên Desk:** Hạn giữ chỗ mặc định · **Nhóm:** Giữ chỗ, cọc, hủy · **Quy tắc:** BR-302
- **Ý nghĩa:** Số giờ giữ chỗ khi lễ tân không chọn mức khác.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 72 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 24: giữ lúc 10:00 hôm nay → hết hạn 10:00 mai (không quá 12:00 ngày đến).
- **Ảnh hưởng:** Giữ chỗ trên Desk, mẫu tin chào khách. **Đi kèm:** `hold_hours_options`, `hold_latest_time_on_arrival`
- **Đội đề xuất:** 24 – INV-006 (BR-302).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Phải là một trong các mức ở `hold_hours_options`. Giữ chỗ đã tạo giữ hạn cũ. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-hold-hours-options"></a>
#### `hold_hours_options`

- **Tên trên Desk:** Các mức giữ chỗ cho chọn · **Nhóm:** Giữ chỗ, cọc, hủy · **Quy tắc:** BR-302
- **Ý nghĩa:** Các mức giờ giữ chỗ cho lễ tân chọn.
- **Đơn vị:** Danh sách số giờ
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** [12, 24, 48].
- **Ảnh hưởng:** Giữ chỗ trên Desk. **Đi kèm:** `hold_hours_default`
- **Đội đề xuất:** [12, 24, 48] – INV-006.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Bỏ một mức đang là mặc định thì Desk từ chối. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-quote-validity-days"></a>
#### `quote_validity_days`

- **Tên trên Desk:** Hiệu lực báo giá · **Nhóm:** Giữ chỗ, cọc, hủy · **Quy tắc:** BR-304
- **Ý nghĩa:** Báo giá có hiệu lực bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 3: báo giá lập 06/11 → giữ số tới hết 09/11.
- **Ảnh hưởng:** Báo giá Desk, mẫu tin báo giá. **Đi kèm:** `hold_hours_default`
- **Đội đề xuất:** 3 – INV-006 (BR-304).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-short-stay-deposit-pct"></a>
#### `short_stay_deposit_pct` [Giá]

- **Tên trên Desk:** Cọc ngắn ngày · **Nhóm:** Giữ chỗ, cọc, hủy · **Quy tắc:** BR-305
- **Ý nghĩa:** Cọc giữ phòng ngắn ngày bằng bao nhiêu % tiền phòng.
- **Đơn vị:** % tiền phòng
- **Giới hạn:** Từ 0 đến 100 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30 %: 2 đêm 1.600.000 → cọc 480.000, làm tròn 100.000 → 500.000.
- **Ảnh hưởng:** Báo giá Desk, mẫu tin chào khách, phiếu thu. **Đi kèm:** `deposit_base`, `rounding.deposit`
- **Đội đề xuất:** 30 – INV quyết ESC-006.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="g-occupancy"></a>

## Nhóm "Số người & phụ thu"

<a id="k-adult-from-age"></a>
#### `adult_from_age` [Giá]

- **Tên trên Desk:** Tính là người lớn từ · **Nhóm:** Số người & phụ thu · **Quy tắc:** BR-110
- **Ý nghĩa:** Từ tuổi này tính là người lớn.
- **Đơn vị:** Tuổi
- **Giới hạn:** Từ 6 đến 18 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12: khách 12 tuổi nhập ở ô "Người lớn".
- **Ảnh hưởng:** Báo giá, khai báo lưu trú. **Đi kèm:** `child_fee_6_11`, `child_free_under_age`
- **Đội đề xuất:** 12 – INV quyết ESC-004. Mức phụ thu người lớn và trẻ 6–11 nay bằng nhau nên tuổi này không làm đổi tiền.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-child-fee-6-11"></a>
#### `child_fee_6_11` [Giá]

- **Tên trên Desk:** Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm) · **Nhóm:** Số người & phụ thu · **Quy tắc:** BR-110
- **Ý nghĩa:** Phụ thu mỗi trẻ 6–11 tuổi vượt định mức, mỗi đêm.
- **Đơn vị:** VND / trẻ / đêm
- **Giới hạn:** Từ 0 đến 2.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Căn 302 định mức 3, có 3 người lớn + 1 trẻ 8 tuổi, 2 đêm → 150.000 × 2 = 300.000.
- **Ảnh hưởng:** Báo giá Desk, web, hóa đơn. **Đi kèm:** `child_free_under_age`, `adult_from_age`, `extra_adult_fee`
- **Đội đề xuất:** 150.000 – INV quyết ESC-045 câu 3 (01/11), nhắc lại 06/11: từ 6 tuổi tính như người lớn.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Nên bằng `extra_adult_fee`. Tên trên Desk vẫn ghi "6–11 tuổi". Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-child-free-under-age"></a>
#### `child_free_under_age` [Giá]

- **Tên trên Desk:** Trẻ miễn phí, không tính số người – dưới · **Nhóm:** Số người & phụ thu · **Quy tắc:** BR-110
- **Ý nghĩa:** Trẻ dưới tuổi này miễn phí và không tính vào số người của căn.
- **Đơn vị:** Tuổi
- **Giới hạn:** Từ 0 đến 12 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 6: bé 5 tuổi ở cùng → 0 đ, không chiếm chỗ.
- **Ảnh hưởng:** Báo giá, kiểm số người tối đa. **Đi kèm:** `child_fee_6_11`, `adult_from_age`
- **Đội đề xuất:** 6 – INV quyết ESC-004, ESC-045 câu 3.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-extra-adult-fee"></a>
#### `extra_adult_fee` [Giá]

- **Tên trên Desk:** Phụ thu người lớn vượt định mức (mỗi đêm) · **Nhóm:** Số người & phụ thu · **Quy tắc:** BR-110
- **Ý nghĩa:** Phụ thu mỗi người lớn vượt định mức của căn, mỗi đêm.
- **Đơn vị:** VND / người / đêm
- **Giới hạn:** Từ 0 đến 2.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Studio định mức 2, có 3 người lớn, 2 đêm → 150.000 × 2 = 300.000.
- **Ảnh hưởng:** Báo giá Desk, web, hóa đơn. Không tính vào cọc. **Đi kèm:** `adult_from_age`, `child_fee_6_11`, `short_stay_deposit_pct`
- **Đội đề xuất:** 150.000 – INV quyết ESC-004.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="g-time"></a>

## Nhóm "Giờ nhận/trả"

<a id="k-checkin-time"></a>
#### `checkin_time`

- **Tên trên Desk:** Nhận phòng từ · **Nhóm:** Giờ nhận/trả · **Quy tắc:** BR-401
- **Ý nghĩa:** Giờ nhận phòng chuẩn.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12:00: khách nhận 12:00 trở đi không phụ thu.
- **Ảnh hưởng:** Màn nhận phòng, bậc nhận sớm, trang khách, mẫu tin, hạn giữ chỗ. **Đi kèm:** `early_checkin_tiers`, `hold_latest_time_on_arrival`, `checkout_time`
- **Đội đề xuất:** 12:00 – INV 26/10 (FB-INV-004). Câu nói với khách giữ 12:00.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Đổi giờ này thì đổi cả chữ trên OTA, house rules, mẫu tin. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-checkout-time"></a>
#### `checkout_time`

- **Tên trên Desk:** Trả phòng trước · **Nhóm:** Giờ nhận/trả · **Quy tắc:** BR-401
- **Ý nghĩa:** Giờ trả phòng chuẩn.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12:00: trả sau 12:00 (quá ân hạn) thì phụ thu.
- **Ảnh hưởng:** Màn trả phòng, nhắc trả phòng, buồng phòng, trang khách. **Đi kèm:** `late_checkout_tiers`, `late_grace_until`, `checkout_reminders`
- **Đội đề xuất:** 12:00 – INV-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Đổi thì đổi cả chữ trên OTA và mẫu tin. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-late-grace-until"></a>
#### `late_grace_until` [Giá]

- **Tên trên Desk:** Ân hạn trả muộn tới · **Nhóm:** Giờ nhận/trả · **Quy tắc:** BR-412
- **Ý nghĩa:** Ân hạn trả muộn: trả trước giờ này thì không phụ thu.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12:30: khách trả 12:20 → 0 đ; trả 12:40 → phụ thu 30 %.
- **Ảnh hưởng:** Màn trả phòng, nhắc trả phòng. **Đi kèm:** `late_checkout_tiers`, `late_grace_requires_no_same_day_arrival`, `checkout_reminders`
- **Đội đề xuất:** 12:30 – INV-007.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-no-show-call-time"></a>
#### `no_show_call_time`

- **Tên trên Desk:** Giờ gọi khách chưa đến · **Nhóm:** Giờ nhận/trả · **Quy tắc:** BR-311
- **Ý nghĩa:** Giờ lễ tân gọi khách chưa tới trong ngày đến.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 18:00: khách chưa tới → Desk nhắc gọi.
- **Ảnh hưởng:** Mục Cần chú ý. **Đi kèm:** `no_show_mark_time`, `no_show_auto`
- **Đội đề xuất:** 18:00 – INV-006 (BR-311).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-no-show-mark-time"></a>
#### `no_show_mark_time`

- **Tên trên Desk:** Giờ được đánh dấu không đến · **Nhóm:** Giờ nhận/trả · **Quy tắc:** BR-311
- **Ý nghĩa:** Sau giờ này được đánh dấu khách không đến (no-show).
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 23:00: khách không tới, không liên lạc → được đánh dấu no-show.
- **Ảnh hưởng:** Nút no-show, mở bán lại căn. **Đi kèm:** `no_show_call_time`, `no_show_auto`
- **Đội đề xuất:** 23:00 – INV-006.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Phải muộn hơn `no_show_call_time`. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="g-money"></a>

## Nhóm "FOC, hoa hồng, phí kênh"

<a id="k-foc-alert-count-per-approver"></a>
#### `foc_alert_count_per_approver`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-435
- **Ý nghĩa:** Cảnh báo khi một người duyệt quá bao nhiêu lần FOC trong tháng.
- **Đơn vị:** Lần
- **Giới hạn:** Từ 1 đến 1.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 10: quản lý duyệt lần thứ 11 trong tháng → cảnh báo chủ đầu tư.
- **Ảnh hưởng:** Cần chú ý. **Đi kèm:** `foc_alert_pct_of_room_revenue`
- **Đội đề xuất:** 10 – INV-007. Từ v1.0.5 (BR-438, V5-16) ngưỡng này cũng áp cho số lần một lễ tân tự sửa giảm dòng mình ghi trong tháng.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-foc-alert-pct-of-room-revenue"></a>
#### `foc_alert_pct_of_room_revenue`

- **Tên trên Desk:** Cảnh báo khi miễn phí (FOC) vượt % doanh thu phòng · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-435
- **Ý nghĩa:** Cảnh báo khi tổng miễn phí trong tháng vượt bao nhiêu % doanh thu phòng.
- **Đơn vị:** %
- **Giới hạn:** Từ 0 đến 100 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 3 %: doanh thu phòng 100.000.000, FOC 3.500.000 → cảnh báo.
- **Ảnh hưởng:** Tổng quan, Cần chú ý. **Đi kèm:** `foc_alert_count_per_approver`
- **Đội đề xuất:** 3 – INV-007 (BR-435).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-foc-approval-push-roles"></a>
#### `foc_approval_push_roles`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-432
- **Ý nghĩa:** Yêu cầu FOC được báo cho ai duyệt.
- **Đơn vị:** Chữ (lựa chọn)
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "lowest_sufficient_role_plus_manager": báo vai thấp nhất đủ hạn mức và quản lý.
- **Ảnh hưởng:** Thông báo Cần duyệt. **Đi kèm:** `foc_limits`
- **Đội đề xuất:** lowest_sufficient_role_plus_manager – BR-432 (chuẩn ngành).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-foc-limits"></a>
#### `foc_limits`

- **Tên trên Desk:** Hạn mức duyệt miễn phí (FOC) theo vai · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-433
- **Ý nghĩa:** Hạn mức duyệt miễn phí (FOC) của từng vai.
- **Đơn vị:** {front_desk_lead, manager, owner}: VND mỗi lần / mỗi tháng, hoặc "one_night_rate", "unlimited"
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Lễ tân trưởng 300.000/lần, 1.500.000/tháng; quản lý tối đa 1 đêm/lần; chủ đầu tư không giới hạn. Miễn 400.000 → lễ tân trưởng không duyệt được, chuyển quản lý.
- **Ảnh hưởng:** Duyệt FOC, Cần duyệt. **Đi kèm:** `foc_approval_push_roles`, `foc_self_apply.front_desk.per_time`
- **Đội đề xuất:** Như ví dụ. – INV-007 (BR-433).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Lễ tân trưởng không được hạn mức cao hơn quản lý. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-foc-self-apply-front-desk-categories"></a>
#### `foc_self_apply.front_desk.categories`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-436
- **Ý nghĩa:** Loại khoản lễ tân được tự áp miễn phí.
- **Đơn vị:** Danh sách loại
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** ["minibar"]: chỉ minibar.
- **Ảnh hưởng:** FOC. **Đi kèm:** `foc_self_apply.front_desk.per_time`
- **Đội đề xuất:** ["minibar"] – INV-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-foc-self-apply-front-desk-per-month"></a>
#### `foc_self_apply.front_desk.per_month`

- **Tên trên Desk:** Lễ tân tự áp miễn phí (FOC) – mỗi tháng · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-436
- **Ý nghĩa:** Lễ tân tự áp miễn phí – tổng tối đa mỗi người mỗi tháng.
- **Đơn vị:** VND
- **Giới hạn:** Từ 0 đến 50.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 500.000: đã tự áp 480.000 trong tháng → khoản 30.000 tiếp theo phải xin duyệt.
- **Ảnh hưởng:** FOC. **Đi kèm:** `foc_self_apply.front_desk.per_time`
- **Đội đề xuất:** 500.000 – INV-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-foc-self-apply-front-desk-per-time"></a>
#### `foc_self_apply.front_desk.per_time`

- **Tên trên Desk:** Lễ tân tự áp miễn phí (FOC) – mỗi lần · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-436
- **Ý nghĩa:** Lễ tân tự áp miễn phí không cần duyệt – tối đa mỗi lần.
- **Đơn vị:** VND
- **Giới hạn:** Từ 0 đến 5.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 100.000: miễn 1 lon nước minibar 30.000 → lễ tân tự áp.
- **Ảnh hưởng:** Folio, FOC. **Đi kèm:** `foc_self_apply.front_desk.per_month`, `foc_self_apply.front_desk.categories`
- **Đội đề xuất:** 100.000 – INV-007 (BR-436).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-short-stay-commission-pct"></a>
#### `short_stay_commission_pct`

- **Tên trên Desk:** Hoa hồng sale/CTV – khách ngắn ngày · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-903
- **Ý nghĩa:** Tỷ lệ hoa hồng cho sale nội bộ và CTV khi bán đơn ngắn ngày.
- **Đơn vị:** Không ghi ở tài liệu
- **Giới hạn, mặc định, ví dụ:** không ghi ở tài liệu này (hoa hồng hoặc thông tin tài khoản).
- **Ảnh hưởng:** Folio, báo cáo hoa hồng. **Đi kèm:** `commission_payable_day`, `commission_pay_by_day`
- **Đội đề xuất:** Theo bảng nội bộ của chủ đầu tư. – INV 01/11 (BR-903). Không ghi số trong kho mã. Từ v1.0.5 (H2, V5-30): mã không còn số mặc định; thiếu tỷ lệ thì Desk báo "chưa có tỷ lệ hoa hồng", không tính bằng 0; cơ sở tính theo bảng nội bộ (xem mục [Sắp có ở v1.0.5](#sap-co-v105)).
- **Lưu ý khi sửa:** Đơn đã tạo giữ tỷ lệ lúc tạo (BR-006). Chỉ chủ đầu tư. Không gửi con số cho đội. Đơn đã tạo giữ tỷ lệ lúc tạo (BR-006). Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-vat-rate"></a>
#### `vat_rate` [Giá]

- **Tên trên Desk:** Thuế suất VAT · **Nhóm:** FOC, hoa hồng, phí kênh · **Quy tắc:** BR-523
- **Ý nghĩa:** Thuế suất VAT.
- **Đơn vị:** % (0, 5, 8 hoặc 10)
- **Giới hạn:** Chỉ nhận: 0, 5, 8, 10 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 8 %: giá 800.000 đã gồm VAT → tiền trước thuế 740.741, thuế 59.259.
- **Ảnh hưởng:** Hóa đơn, bill, báo cáo doanh thu. **Đi kèm:** `prices_include_vat`
- **Đội đề xuất:** 8 (đến khi kế toán xác nhận ngày hết hiệu lực) – BR-523 – cần kế toán xác nhận [PL].
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Chỉ chủ đầu tư sửa. Đặt Hiệu lực từ đúng ngày luật đổi thuế suất. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="g-security"></a>

## Nhóm "Bảo mật"

<a id="k-c3-stepup-minutes"></a>
#### `c3_stepup_minutes` [Bảo mật]

- **Tên trên Desk:** Thời gian xem giấy tờ, số tài khoản sau khi nhập lại mật khẩu (tên này từ v1.0.5; v1.0.4: "Thời gian xem giấy tờ sau khi nhập lại mật khẩu") · **Nhóm:** Bảo mật · **Quy tắc:** SR-C3-09
- **Ý nghĩa:** Sau khi nhập lại mật khẩu để xem giấy tờ khách hoặc xem đủ số tài khoản nhận hoàn tiền, được xem tiếp trong bao nhiêu phút. Mỗi lần xem trong khoảng này tính lại từ đầu.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 1 đến 15 (biên cứng của đội bảo mật) · **Mặc định:** 15
- **Ví dụ:** 15.
- **Ảnh hưởng:** Xem ảnh giấy tờ, xem đủ số tài khoản nhận hoàn tiền. **Đi kèm:** –
- **Đội đề xuất:** 15 – SR-C3-09.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-guest-level2-idle-minutes"></a>
#### `guest_level2_idle_minutes` [Bảo mật]

- **Tên trên Desk:** Khách tự thoát sau thời gian không dùng · **Nhóm:** Bảo mật · **Quy tắc:** SR-GST-09
- **Ý nghĩa:** Trang khách tự thoát sau bao nhiêu phút không dùng.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 5 đến 30 (biên cứng của đội bảo mật) · **Mặc định:** 30
- **Ví dụ:** 30.
- **Ảnh hưởng:** Trang khách. **Đi kèm:** –
- **Đội đề xuất:** 30 – SR-GST-09.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Bản hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-guest-link-grace-hours"></a>
#### `guest_link_grace_hours` [Bảo mật]

- **Tên trên Desk:** Link khách còn mở được sau khi trả phòng · **Nhóm:** Bảo mật · **Quy tắc:** SR-GST-05/11
- **Ý nghĩa:** Link trang khách còn mở được bao nhiêu giờ sau trả phòng.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 0 đến 24 (biên cứng của đội bảo mật) · **Mặc định:** 24
- **Ví dụ:** 24.
- **Ảnh hưởng:** Trang khách. **Đi kèm:** –
- **Đội đề xuất:** 24 – SR-GST-05/11.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-guest-verify-code-channel-minutes"></a>
#### `guest_verify_code_channel_minutes` [Bảo mật]

- **Tên trên Desk:** Hạn mã gửi qua kênh nhắn tin · **Nhóm:** Bảo mật · **Quy tắc:** SR-GST-13
- **Ý nghĩa:** Mã xác minh gửi qua kênh nhắn tin có hạn bao nhiêu phút.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 5 đến 30 (biên cứng của đội bảo mật) · **Mặc định:** 15
- **Ví dụ:** 15.
- **Ảnh hưởng:** Trang khách. **Đi kèm:** `guest_verify_code_channels`
- **Đội đề xuất:** 15 – SR-GST-13.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Bản hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-guest-verify-code-channels"></a>
#### `guest_verify_code_channels` [Bảo mật]

- **Tên trên Desk:** Kênh được gửi mã cho khách · **Nhóm:** Bảo mật · **Quy tắc:** SR-GST-13
- **Ý nghĩa:** Kênh được dùng để gửi mã xác minh cho khách.
- **Đơn vị:** Danh sách: airbnb_inbox, booking_inbox, agoda_inbox, zalo
- **Giới hạn:** Chỉ chọn trong: airbnb_inbox, booking_inbox, agoda_inbox, zalo · **Mặc định:** []
- **Ví dụ:** [] = chưa bật kênh nào.
- **Ảnh hưởng:** Trang khách. **Đi kèm:** `guest_verify_code_channel_minutes`
- **Đội đề xuất:** [] – SR-GST-13.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Bản hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-guest-verify-max-attempts"></a>
#### `guest_verify_max_attempts` [Bảo mật]

- **Tên trên Desk:** Số lần khách nhập sai mã tối đa · **Nhóm:** Bảo mật · **Quy tắc:** SR-GST-08
- **Ý nghĩa:** Khách nhập sai mã xác minh tối đa bao nhiêu lần.
- **Đơn vị:** Lần
- **Giới hạn:** Từ 3 đến 5 (biên cứng của đội bảo mật) · **Mặc định:** 5
- **Ví dụ:** 5.
- **Ảnh hưởng:** Trang khách. **Đi kèm:** –
- **Đội đề xuất:** 5 – SR-GST-08.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Bản hiện tại chưa đọc tham số này; dùng mức cố định bằng mặc định. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-trusted-device-days"></a>
#### `trusted_device_days` [Bảo mật]

- **Tên trên Desk:** Hạn cấp quyền máy quầy/laptop · **Nhóm:** Bảo mật · **Quy tắc:** SR-DEV-01
- **Ý nghĩa:** Máy quầy, laptop được cấp quyền dùng Desk trong bao nhiêu ngày rồi phải cấp lại.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 180 (biên cứng của đội bảo mật) · **Mặc định:** 180
- **Ví dụ:** 180.
- **Ảnh hưởng:** Đăng nhập Desk, Thiết bị được cấp. **Đi kèm:** `trusted_device_mobile_days`
- **Đội đề xuất:** 180 – SR-DEV-01.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-trusted-device-mobile-days"></a>
#### `trusted_device_mobile_days` [Bảo mật]

- **Tên trên Desk:** Hạn cấp quyền máy tính bảng · **Nhóm:** Bảo mật · **Quy tắc:** SR-DEV-08
- **Ý nghĩa:** Máy tính bảng, điện thoại được cấp quyền trong bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 30 (biên cứng của đội bảo mật) · **Mặc định:** 30
- **Ví dụ:** 30.
- **Ảnh hưởng:** Đăng nhập app nhân viên. **Đi kèm:** `trusted_device_days`
- **Đội đề xuất:** 30 – SR-DEV-08.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="g-other"></a>

## Nhóm "Khác"

Chủ đề trong nhóm: Giá ngắn ngày · Website · Thuê tháng · Nhận/trả phòng và lưu trú · Giữ chỗ, cọc, hủy · Phí, phạt, dịch vụ · Tiền, thuế, hóa đơn · FOC (miễn phí) và hoa hồng · Kênh OTA và trùng phòng · Khai báo lưu trú và dữ liệu khách · Buồng phòng và bảo trì · Mất mạng, mất điện · Khóa cửa · Bảo mật · Hệ thống.

### Khác – Giá ngắn ngày

<a id="k-booking-window-days"></a>
#### `booking_window_days` [Giá]

- **Tên trên Desk:** Nhận đặt trước tối đa (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-112
- **Ý nghĩa:** Nhận đặt trước tối đa bao nhiêu ngày tính từ hôm nay.
- **Đơn vị:** Số ngày
- **Giới hạn:** Từ 30 đến 730 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 365: hôm nay 06/11/2026 thì nhận ngày đến tới 06/11/2027.
- **Ảnh hưởng:** Báo giá Desk, web. **Đi kèm:** `web_estimate.open_until`
- **Đội đề xuất:** 365 – BR-112. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-deposit-base"></a>
#### `deposit_base` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-305
- **Ý nghĩa:** Cọc tính trên phần nào của đơn.
- **Đơn vị:** Chữ (lựa chọn của hệ thống)
- **Giới hạn:** Không có giới hạn số. Desk chỉ kiểm là chữ (tối đa 500 ký tự), chưa kiểm có đúng một giá trị trong danh sách: gõ sai chữ Desk vẫn lưu. Chép đúng chữ ở mục Ví dụ. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "room_total_after_calendar_and_discount": cọc tính trên tiền phòng, không tính phụ thu người, nhận sớm, dịch vụ.
- **Ảnh hưởng:** Cọc ngắn ngày. **Đi kèm:** `short_stay_deposit_pct`
- **Đội đề xuất:** room_total_after_calendar_and_discount – BR-305 (chuẩn ngành).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại tính cọc theo cách này cố định; sửa tham số chưa có tác dụng. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-long-stay-compare-from-nights"></a>
#### `long_stay_compare_from_nights` [Giá]

- **Tên trên Desk:** Hiện so sánh thuê 1 tháng từ (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-108
- **Ý nghĩa:** Từ bao nhiêu đêm Desk hiện thêm khối "So sánh: thuê 1 tháng" trong báo giá.
- **Đơn vị:** Số đêm
- **Giới hạn:** Từ 7 đến 60 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30: khách 20 đêm chỉ thấy giá đêm 16.000.000, không thấy khối so sánh.
- **Ảnh hưởng:** Hộp báo giá Desk (chỉ nội bộ). **Đi kèm:** `long_stay_required_from_nights`, `lease_terms`
- **Đội đề xuất:** 30 – INV quyết ESC-045 câu 6: chỉ từ 30 đêm mới chào thuê tháng.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-long-stay-required-from-nights"></a>
#### `long_stay_required_from_nights` [Giá]

- **Tên trên Desk:** Bắt buộc thuê dài hạn từ (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-108
- **Ý nghĩa:** Từ bao nhiêu đêm thì bắt buộc làm thuê tháng (không bán giá đêm nữa).
- **Đơn vị:** Số đêm
- **Giới hạn:** Từ 14 đến 90 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30: khách hỏi 30 đêm → Desk báo đây là thuê dài hạn, không ra giá ngắn ngày.
- **Ảnh hưởng:** Báo giá Desk, web, form đặt phòng. **Đi kèm:** `short_stay_max_nights`, `long_stay_compare_from_nights`
- **Đội đề xuất:** 30 – INV 01/11 và 06/11: thuê tháng từ 30 đêm (BR-108).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Đổi cùng lúc với `short_stay_max_nights` (số này trừ 1). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-los-discount"></a>
#### `los_discount` [Giá]

- **Tên trên Desk:** Giảm giá theo số đêm ở (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-107
- **Ý nghĩa:** Giảm giá theo số đêm ở (ở càng lâu giảm càng nhiều).
- **Đơn vị:** Danh sách {minNights: số đêm từ, pct: % giảm}; [] = không giảm
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận tối đa 10 bậc {minNights, pct}: `minNights` số nguyên 1–89, không trùng; `pct` 0–100, tối đa 2 chữ số thập phân. `[]` = không giảm. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** [{"minNights":7,"pct":10}]: đơn 7 đêm × 800.000 = 5.600.000 → giảm 10 % còn 5.040.000. [] → 5.600.000.
- **Ảnh hưởng:** Báo giá Desk, web, cọc. Không cộng dồn với mã khách quay lại (`stackable`). **Đi kèm:** `return_guest_pct`, `stackable`, `short_stay_max_nights`
- **Đội đề xuất:** [] – Bảng giá INV 01/11: không giảm theo số đêm.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Nếu sau này bật lại: đơn tạo trước giữ bậc cũ (BR-006, BR-107), nhưng gia hạn đơn cũ có thể tính lại theo bậc mới – hỏi đội trước. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-min-stay"></a>
#### `min_stay` [Giá]

- **Tên trên Desk:** Ở tối thiểu (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-113
- **Ý nghĩa:** Ở tối thiểu: đến vào những ngày này thì phải ở ít nhất bao nhiêu đêm.
- **Đơn vị:** Danh sách luật. Mỗi luật: {"nights": số đêm, "channels": "all" hoặc danh sách nhóm kênh, "arrivalWeekdays": danh sách mã thứ như "FRI", "SAT", và/hoặc "arrivalOnSpecialDates": true}
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm đúng dạng khi lưu (BUG-R5-003): cho lưu cả `2` hay `{"nights":2}`, rồi mọi báo giá và đơn trực tiếp mới báo lỗi – xem Lưu ý khi sửa. Từ v1.0.5 (V5-25) Desk chỉ nhận danh sách luật: `nights` từ 1 đến 7 và không quá `short_stay_max_nights`; `channels` là "all" hoặc danh sách trong "direct", "agent", "ota"; mỗi luật áp vào ít nhất một ngày; `[]` = không có ở tối thiểu (xem mục Sắp có ở v1.0.5). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Giá trị đúng dạng: [{"nights":2,"channels":"all","arrivalWeekdays":["FRI","SAT"]},{"nights":2,"channels":"all","arrivalOnSpecialDates":true}]. Đến thứ Sáu, quy tắc 2 đêm → báo giá 1 đêm bị chặn ("chưa đủ số đêm tối thiểu"); 2 đêm thứ Sáu + thứ Bảy Studio = 1.600.000. Sai: 2 hoặc {"nights":2} – Desk v1.0.4 cho lưu, rồi báo giá lỗi.
- **Ảnh hưởng:** Báo giá Desk, form web, đơn mới. **Đi kèm:** `special_dates`, `min_stay_orphan_night_exception`, `short_stay_max_nights` (từ v1.0.5)
- **Đội đề xuất:** 2 đêm khi ngày đến là thứ Sáu, thứ Bảy hoặc ngày đặc biệt; mọi kênh. – INV quyết ESC-004 (BR-113).
- **Lưu ý khi sửa:** **Tới khi v1.0.5 lên, không bấm Lưu thay đổi ở dòng này** (cùng `weekend_nights`). Buộc phải đổi thì nhắn đội trước, chọn **Hiệu lực từ** là ngày mai để còn **Hủy lịch**; giữ nguyên dạng danh sách, chỉ đổi số `nights` hoặc mã thứ. Lỡ lưu thì báo đội ngay, coi là P0: mọi báo giá, đơn trực tiếp mới (và giá ước tính trên web) báo lỗi tới 06:00 hôm sau, khi đội đã lưu lại giá trị đúng cho ngày mai (BUG-R5-003). Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi tới ngày hiệu lực, báo giá thử một ca trên Desk (không lưu báo giá). Trên OTA phải cài cùng quy tắc bằng tay (chưa có channel manager). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu.

<a id="k-min-stay-orphan-night-exception"></a>
#### `min_stay_orphan_night_exception` [Giá]

- **Tên trên Desk:** Cho bán đêm lẻ kẹp giữa hai đơn (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-113
- **Ý nghĩa:** Cho phép bán 1 đêm lẻ kẹp giữa hai đơn dù ngày đó có quy tắc ở tối thiểu.
- **Đơn vị:** Bật / tắt (true/false)
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Căn 102 có khách tới tối thứ Sáu và khách mới từ Chủ nhật → đêm thứ Bảy lẻ vẫn bán 1 đêm được.
- **Ảnh hưởng:** Báo giá Desk, gán căn. **Đi kèm:** `min_stay`
- **Đội đề xuất:** Bật (true) – Không để căn trống vô ích (BR-113, chuẩn ngành).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-ota-base-rate"></a>
#### `ota_base_rate` [Giá]

- **Tên trên Desk:** Giá gốc riêng cho đơn OTA (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-103
- **Ý nghĩa:** Giá gốc riêng cho đơn OTA theo nhóm căn. Có dòng này thì nó thắng giá đêm niêm yết của căn.
- **Đơn vị:** Danh sách theo nhóm căn {L12, N, NPLUS}: VND/đêm
- **Giới hạn:** Từ 100.000 đến 20.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** {"L12":800000,"N":1300000,"NPLUS":1100000}: đơn OTA căn Lầu 1–2 để trống giá → 800.000/đêm.
- **Ảnh hưởng:** Giá đơn OTA khi lễ tân để trống giá, giá sàn – trần. **Đi kèm:** `rate_floor_pct`, `rate_ceiling_pct`, `rounding.ota_rate`
- **Đội đề xuất:** Không cần dòng này (để trống). – Từ v1.0.4, không có dòng thì Desk lấy giá đêm niêm yết của căn (BR-103, #73). Có dòng thì mỗi lần đổi giá căn phải đổi dòng này cùng lúc.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Nếu đã có dòng mà quên đổi khi đổi giá căn, đơn OTA sẽ ra giá cũ. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rate-ceiling-pct"></a>
#### `rate_ceiling_pct` [Giá]

- **Tên trên Desk:** Giá trần (% giá gốc) (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-105
- **Ý nghĩa:** Giá trần: giá một đêm không được cao hơn bao nhiêu % so với giá gốc.
- **Đơn vị:** % của giá gốc
- **Giới hạn:** Từ 100 đến 500 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Giá gốc 800.000, trần 250 % → không gõ được giá trên 2.000.000.
- **Ảnh hưởng:** Ô sửa giá đêm, đơn OTA. **Đi kèm:** `rate_floor_pct`, `ota_base_rate`
- **Đội đề xuất:** 250 – Chặn gõ nhầm giá quá cao (BR-105). [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rate-floor-pct"></a>
#### `rate_floor_pct` [Giá]

- **Tên trên Desk:** Giá sàn (% giá gốc) (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-105
- **Ý nghĩa:** Giá sàn: giá một đêm không được thấp hơn bao nhiêu % so với giá gốc của căn.
- **Đơn vị:** % của giá gốc
- **Giới hạn:** Từ 10 đến 100 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Giá gốc 800.000, sàn 70 % → lễ tân không gõ được giá dưới 560.000.
- **Ảnh hưởng:** Ô sửa giá đêm trên đơn, đơn OTA, giá đêm thêm. **Đi kèm:** `rate_ceiling_pct`, `ota_base_rate`
- **Đội đề xuất:** 70 – Chặn gõ nhầm giá quá thấp (BR-105). [GIẢ ĐỊNH – chờ INV xác nhận]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Sàn phải nhỏ hơn trần; Desk từ chối nếu không. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-return-guest-code"></a>
#### `return_guest_code` [Giá]

- **Tên trên Desk:** Mã khách quay lại (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-111
- **Ý nghĩa:** Mã giảm giá cho khách quay lại.
- **Đơn vị:** Chữ (mã)
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "OTTIMO-BACK5": khách đọc mã này khi đặt trực tiếp.
- **Ảnh hưởng:** Báo giá Desk kênh Trực tiếp. **Đi kèm:** `return_guest_pct`, `stackable`
- **Đội đề xuất:** OTTIMO-BACK5 – BR-111. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-return-guest-pct"></a>
#### `return_guest_pct` [Giá]

- **Tên trên Desk:** Giảm cho khách quay lại (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-111
- **Ý nghĩa:** Phần trăm giảm khi khách dùng mã khách quay lại.
- **Đơn vị:** % (số nguyên)
- **Giới hạn:** Từ 0 đến 50 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 5 %: 2 đêm × 800.000 = 1.600.000 → giảm 80.000 còn 1.520.000.
- **Ảnh hưởng:** Báo giá Desk kênh Trực tiếp. **Đi kèm:** `return_guest_code`, `stackable`, `los_discount`
- **Đội đề xuất:** 5 – BR-111. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rounding-deposit"></a>
#### `rounding.deposit` [Giá]

- **Tên trên Desk:** Làm tròn tiền cọc (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-005
- **Ý nghĩa:** Cọc ngắn ngày được làm tròn tới bội số nào.
- **Đơn vị:** VND (1, 100, 1.000, 10.000, 100.000)
- **Giới hạn:** Chỉ nhận: 1, 100, 1.000, 10.000, 100.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 100.000: cọc 1.561.500 → 1.600.000.
- **Ảnh hưởng:** Báo giá, mẫu tin, phiếu thu cọc. **Đi kèm:** `short_stay_deposit_pct`
- **Đội đề xuất:** 100.000 – BR-005. [GIẢ ĐỊNH – bảng giá không nói]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rounding-fee"></a>
#### `rounding.fee` [Giá]

- **Tên trên Desk:** Làm tròn phí, phụ thu (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-005
- **Ý nghĩa:** Phí, phụ thu (nhận sớm, trả muộn, dịch vụ) được làm tròn tới bội số nào.
- **Đơn vị:** VND (1, 100, 1.000, 10.000, 100.000)
- **Giới hạn:** Chỉ nhận: 1, 100, 1.000, 10.000, 100.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 1.000: 30 % × 750.000 = 225.000.
- **Ảnh hưởng:** Phụ thu tại quầy, hóa đơn. **Đi kèm:** `early_checkin_tiers`, `late_checkout_tiers`
- **Đội đề xuất:** 1.000 – INV quyết ESC-004.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rounding-night-rate"></a>
#### `rounding.night_rate` [Giá]

- **Tên trên Desk:** Làm tròn giá đêm (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-005
- **Ý nghĩa:** Giá đêm tính ra (giá đêm niêm yết từ giá tháng, giá sau tăng cuối tuần hoặc ngày đặc biệt, sau giảm theo số đêm) và giá một ngày khi tính lẻ ngày thuê tháng được làm tròn tới bội số nào. Phụ thu, phí làm tròn theo `rounding.fee`.
- **Đơn vị:** VND (1, 100, 1.000, 10.000, 100.000)
- **Giới hạn:** Chỉ nhận: 1, 100, 1.000, 10.000, 100.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 1.000: 666.667 → 667.000.
- **Ảnh hưởng:** Báo giá, web, hóa đơn. **Đi kèm:** `rounding.fee`
- **Đội đề xuất:** 1.000 – INV quyết ESC-004; bảng giá 01/11.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rounding-ota-rate"></a>
#### `rounding.ota_rate` [Giá]

- **Tên trên Desk:** Làm tròn giá đêm đơn OTA (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-005
- **Ý nghĩa:** Giá đêm tính cho đơn OTA (khi lễ tân để trống giá) được làm tròn tới bội số nào.
- **Đơn vị:** VND
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 10.000: 1.198.300 → 1.200.000. 1.000: → 1.198.000.
- **Ảnh hưởng:** Giá đơn OTA để trống giá. **Đi kèm:** `ota_base_rate`, `rounding.night_rate`
- **Đội đề xuất:** 1.000 – Đề xuất DOM theo BR-005 v0.5.0 (một mức giá, mọi số làm tròn 1.000). Với giá hiện tại (800.000, 1.100.000, 1.300.000, không tăng) hai mức cho cùng một số.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-short-stay-max-nights"></a>
#### `short_stay_max_nights` [Giá]

- **Tên trên Desk:** Đơn ngắn ngày dài nhất (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-112
- **Ý nghĩa:** Đơn ngắn ngày dài nhất bao nhiêu đêm.
- **Đơn vị:** Số đêm
- **Giới hạn:** Từ 1 đến 89 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 29: đơn 29 đêm Studio = 29 × 800.000 = 23.200.000; đơn 30 đêm phải làm thuê tháng.
- **Ảnh hưởng:** Báo giá Desk, web (web không hiện số từ 30 đêm). **Đi kèm:** `long_stay_required_from_nights`, `long_stay_compare_from_nights`
- **Đội đề xuất:** 29 – Bảng giá INV 01/11; INV nhắc lại 06/11 (ngắn ngày tối đa 29 đêm).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Phải bằng `long_stay_required_from_nights` − 1. Đổi cùng lúc, đổi `long_stay_required_from_nights` trước. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-special-dates"></a>
#### `special_dates` [Giá]

- **Tên trên Desk:** Danh sách ngày đặc biệt (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-104
- **Ý nghĩa:** Danh sách ngày đặc biệt (lễ, Tết, Noel). Mỗi dòng có tên, ngày bắt đầu, ngày kết thúc (đêm cuối là ngày trước ngày kết thúc).
- **Đơn vị:** Danh sách {name, from, to} – ngày dạng yyyy-mm-dd
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận danh sách tối đa 100 khoảng {name, from, to}: ngày có thật dạng yyyy-mm-dd; `to` sau `from` từ 1 đến 31 đêm (mùa dài hơn thì chia nhiều khoảng); `name` tối đa 100 ký tự. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** {"name":"Giỗ Tổ Hùng Vương 2027","from":"2027-04-16","to":"2027-04-17"} = chỉ đêm 16/4/2027.
- **Ảnh hưởng:** Mức tăng ngày đặc biệt, ở tối thiểu 2 đêm (`min_stay`), không hoàn cọc khi hủy (`cancel_peak_no_refund`). **Đi kèm:** `special_uplift_pct`, `min_stay`, `cancel_peak_no_refund`
- **Đội đề xuất:** Đêm 24/12/2026–01/01/2027; Tết đêm 05–10/02/2027; Giỗ Tổ đêm 16/4/2027; đêm 30/4 và 1/5/2027; đêm 1/9 và 2/9/2027. – Giữ danh sách dù mức tăng = 0 %, vì còn dùng cho ở tối thiểu và không hoàn cọc (BR-104).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Mỗi năm thêm ngày của năm sau (Tết, Giỗ Tổ theo lịch âm). Sửa cả danh sách một lần: sao chép chuỗi cũ, thêm dòng, dán lại. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-special-uplift-channels"></a>
#### `special_uplift_channels` [Giá]

- **Tên trên Desk:** Kênh áp tăng giá ngày đặc biệt (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-104
- **Ý nghĩa:** Mức tăng ngày đặc biệt áp cho kênh nào.
- **Đơn vị:** Chữ: "all" = mọi kênh
- **Giới hạn:** Desk v1.0.4 chỉ kiểm là chữ: gõ sai (ví dụ "Direct") Desk vẫn lưu và mức tăng không áp, không báo. Từ v1.0.5 (V5-25) Desk chỉ nhận một trong "all", "direct", "agent", "ota". · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "all": mọi kênh cùng tăng (nếu mức tăng > 0).
- **Ảnh hưởng:** Báo giá Desk, đơn OTA. **Đi kèm:** `special_uplift_pct`
- **Đội đề xuất:** all – Một mức giá mọi kênh.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-special-uplift-pct"></a>
#### `special_uplift_pct` [Giá]

- **Tên trên Desk:** Tăng giá ngày đặc biệt (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-104
- **Ý nghĩa:** Phần trăm cộng thêm vào giá các đêm thuộc `special_dates`.
- **Đơn vị:** % (số nguyên)
- **Giới hạn:** Từ 0 đến 200 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Giá đêm 1.100.000, mức 30 % → đêm 31/12 là 1.430.000. Mức 0 % → 1.100.000.
- **Ảnh hưởng:** Báo giá Desk, web, đơn OTA để trống giá, cọc. **Đi kèm:** `special_dates`, `special_uplift_channels`, `weekend_uplift_pct`, `min_stay`
- **Đội đề xuất:** 0 – INV quyết ESC-045 câu 1 = A (01/11). Muốn tăng giá Noel – Tết thì báo đội trước 15/12.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Đổi về 0 không bỏ ở tối thiểu 2 đêm và không hoàn cọc ngày lễ – hai việc đó theo `special_dates`. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-stackable"></a>
#### `stackable` [Giá]

- **Tên trên Desk:** Cộng dồn mã khách quay lại với giảm theo số đêm (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-111
- **Ý nghĩa:** Mã khách quay lại có được cộng dồn với giảm theo số đêm không.
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Tắt: đơn được cả hai mức thì áp mức có lợi hơn cho khách, không cộng.
- **Ảnh hưởng:** Báo giá Desk. **Đi kèm:** `return_guest_pct`, `los_discount`
- **Đội đề xuất:** Tắt (false) – BR-111.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-weekend-nights"></a>
#### `weekend_nights` [Giá]

- **Tên trên Desk:** Đêm tính là cuối tuần (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-103
- **Ý nghĩa:** Những đêm nào tính là cuối tuần.
- **Đơn vị:** Danh sách mã thứ trong tuần, viết hoa, trong ngoặc kép: "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN" ("FRI" = đêm thứ Sáu). **Không dùng số 1–7.**
- **Giới hạn:** Mỗi thứ một lần, không để trống. Desk v1.0.4 kiểm sai dạng (BUG-R5-001): xem Lưu ý khi sửa. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** ["FRI","SAT"]: đêm thứ Sáu và đêm thứ Bảy là cuối tuần. Sai: [5,6] – Desk v1.0.4 cho lưu, nhưng bộ tính giá không nhận ra đêm nào, mức tăng cuối tuần mất mà không báo.
- **Ảnh hưởng:** Chỉ mức tăng cuối tuần (`weekend_uplift_pct`): báo giá Desk, giá ước tính trên web, đơn OTA để trống giá. Không ảnh hưởng ở tối thiểu (`min_stay` có danh sách ngày đến riêng). **Đi kèm:** `weekend_uplift_pct`, `weekend_uplift_channels`
- **Đội đề xuất:** ["FRI","SAT"] – Giá trị đang chạy trên production. Mức tăng đang 0 % (ESC-045 câu 1) nên hiện chưa đổi số tiền nào; giữ để khi bật mức tăng thì đúng đêm.
- **Lưu ý khi sửa:** **Tới khi v1.0.5 lên, không bấm Lưu thay đổi ở dòng này** (cùng `min_stay`). Desk v1.0.4 từ chối dạng đúng ["FRI","SAT"] và nhận dạng số 1–7, là dạng làm hỏng phép tính (BUG-R5-001). Buộc phải đổi thì nhắn đội trước, chọn **Hiệu lực từ** là ngày mai để còn **Hủy lịch**. Lỡ lưu thì báo đội ngay, coi là P0. Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi tới ngày hiệu lực, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu.

<a id="k-weekend-uplift-channels"></a>
#### `weekend_uplift_channels` [Giá]

- **Tên trên Desk:** Kênh áp tăng giá cuối tuần (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-103
- **Ý nghĩa:** Mức tăng cuối tuần áp cho kênh nào.
- **Đơn vị:** Chữ: "all" = mọi kênh
- **Giới hạn:** Desk v1.0.4 chỉ kiểm là chữ: gõ sai (ví dụ "Direct") Desk vẫn lưu và mức tăng không áp, không báo. Từ v1.0.5 (V5-25) Desk chỉ nhận một trong "all", "direct", "agent", "ota". · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "all": cả đơn Trực tiếp lẫn OTA đều cộng mức tăng (nếu có).
- **Ảnh hưởng:** Báo giá Desk, đơn OTA để trống giá. **Đi kèm:** `weekend_uplift_pct`
- **Đội đề xuất:** all – Một mức giá mọi kênh (ESC-043 C).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-weekend-uplift-pct"></a>
#### `weekend_uplift_pct` [Giá]

- **Tên trên Desk:** Tăng giá đêm cuối tuần (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-103
- **Ý nghĩa:** Phần trăm cộng thêm vào giá đêm cuối tuần (các đêm ở `weekend_nights`).
- **Đơn vị:** % (số nguyên)
- **Giới hạn:** Từ 0 đến 100 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Giá đêm 800.000, mức 15 % → đêm thứ Sáu 920.000. Mức 0 % → vẫn 800.000.
- **Ảnh hưởng:** Báo giá Desk, giá ước tính trên web, giá đơn OTA khi để trống giá, cọc 30 %. **Đi kèm:** `weekend_nights`, `weekend_uplift_channels`, `special_uplift_pct`, `rounding.night_rate`
- **Đội đề xuất:** 0 – INV quyết ESC-045 câu 1 = A (01/11): một giá mọi đêm.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Muốn tăng giá cuối tuần trở lại thì báo đội trước để đổi cả giá trên OTA cùng ngày. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Website

<a id="k-property-map-url"></a>
#### `property_map_url`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** –
- **Ý nghĩa:** Đường link bản đồ chỉ đường tới OTTIMO.
- **Đơn vị:** Đường link https
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** https://maps.app.goo.gl/oYos42G5YvUEcDCc6
- **Ví dụ:** Link Google Maps INV gửi 17/10.
- **Ảnh hưởng:** Nút "Chỉ đường" trang khách, mẫu tin, bill. **Đi kèm:** –
- **Đội đề xuất:** Link INV gửi 17/10 (mặc định danh mục). – BR-975.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Chỉ nhận link Google Maps, Apple Maps, OpenStreetMap. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-public-booking-request-daily-cap"></a>
#### `public_booking_request_daily_cap` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC ARC-02
- **Ý nghĩa:** Form web nhận tối đa bao nhiêu yêu cầu mỗi ngày (chống spam).
- **Đơn vị:** Yêu cầu / ngày
- **Giới hạn:** Từ 50 đến 500 (biên cứng của đội bảo mật) · **Mặc định:** 100
- **Ví dụ:** 100: yêu cầu thứ 101 trong ngày bị từ chối.
- **Ảnh hưởng:** Form web. **Đi kèm:** `public_booking_request_pow_enabled`
- **Đội đề xuất:** 100 – SEC ARC-02.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-public-booking-request-pow-enabled"></a>
#### `public_booking_request_pow_enabled` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC ARC-22
- **Ý nghĩa:** Bật bước chống máy gửi tự động trên form web.
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Bật hoặc tắt (true/false) · **Mặc định:** tắt
- **Ví dụ:** Bật khi bị spam nhiều.
- **Ảnh hưởng:** Form web. **Đi kèm:** `public_booking_request_spam_pow_threshold_per_week`
- **Đội đề xuất:** Tắt (false) – SEC ARC-22.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-public-booking-request-spam-pow-threshold-per-week"></a>
#### `public_booking_request_spam_pow_threshold_per_week` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC ARC-20
- **Ý nghĩa:** Bao nhiêu yêu cầu spam mỗi tuần thì nên bật chống máy gửi.
- **Đơn vị:** Yêu cầu / tuần
- **Giới hạn:** Từ 5 đến 50 (biên cứng của đội bảo mật) · **Mặc định:** 10
- **Ví dụ:** 10, 2 tuần liền.
- **Ảnh hưởng:** Cảnh báo spam. **Đi kèm:** `public_booking_request_pow_enabled`
- **Đội đề xuất:** 10 – SEC ARC-20.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-public-booking-requests-enabled"></a>
#### `public_booking_requests_enabled` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC ARC-17
- **Ý nghĩa:** Công tắc form "Yêu cầu đặt phòng" trên web ottimo.vn.
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Bật hoặc tắt (true/false) · **Mặc định:** tắt
- **Ví dụ:** Tắt (false): form không nhận, khách thấy nút Zalo.
- **Ảnh hưởng:** Web khách, hàng chờ Yêu cầu từ website. **Đi kèm:** `privacy_notice_version`, `public_booking_request_daily_cap`, `public_show_prices`
- **Đội đề xuất:** Bật (true) – đã bật từ 30/10. – SEC ARC-17.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Tắt có hiệu lực ngay trong ngày. Bật lại theo luật thường. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-public-show-prices"></a>
#### `public_show_prices` [Giá]

- **Tên trên Desk:** Hiện giá ước tính trên web (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-115
- **Ý nghĩa:** Công tắc hiện giá ước tính trên web ottimo.vn.
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** tắt
- **Ví dụ:** Bật: khách chọn hạng, ngày, số khách thì thấy "khoảng 1.600.000, đã gồm thuế". Tắt: chỉ còn form gửi yêu cầu.
- **Ảnh hưởng:** Web khách (form "Plan your stay"). **Đi kèm:** `web_estimate.open_until`, `short_stay_max_nights`, `public_booking_requests_enabled`
- **Đội đề xuất:** Bật (INV quyết, đã bật trên production 06/11/2026 sau khi QA LP-v2 F2 báo giá web khớp Desk 4/4 mẫu). Cần tắt gấp (giá sai, bị cào): OWN đặt false ngay – web hết giá, form vẫn chạy. – Mặc định tắt (SEC SR-PE-08).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Chỉ chủ đầu tư. Tắt (false) có hiệu lực ngay trong ngày, khoảng 2 phút sau web hết hiện giá. Bật lại theo luật thường (từ ngày sau nếu hôm nay đã lưu). Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-retention-web-request-declined-days"></a>
#### `retention.web_request_declined_days` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** T19
- **Ý nghĩa:** Yêu cầu web đã từ chối giữ bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 30 đến 90 (biên cứng của đội bảo mật) · **Mặc định:** 90
- **Ví dụ:** 90.
- **Ảnh hưởng:** Lưu trữ. **Đi kèm:** –
- **Đội đề xuất:** 90 – BR-913.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-retention-web-request-ip-hmac-days"></a>
#### `retention.web_request_ip_hmac_days` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC ARC-03
- **Ý nghĩa:** Dấu vết địa chỉ mạng (đã mã hóa) để chống spam giữ bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 7 đến 30 (biên cứng của đội bảo mật) · **Mặc định:** 30
- **Ví dụ:** 30.
- **Ảnh hưởng:** Lưu trữ. **Đi kèm:** –
- **Đội đề xuất:** 30 – SEC ARC-03.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-retention-web-request-max-age-days"></a>
#### `retention.web_request_max_age_days` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** T19
- **Ý nghĩa:** Mọi yêu cầu web giữ tối đa bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 90 đến 180 (biên cứng của đội bảo mật) · **Mặc định:** 180
- **Ví dụ:** 180.
- **Ảnh hưởng:** Lưu trữ. **Đi kèm:** –
- **Đội đề xuất:** 180 – BR-913.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-retention-web-request-spam-days"></a>
#### `retention.web_request_spam_days` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** T19
- **Ý nghĩa:** Yêu cầu spam giữ bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 7 (biên cứng của đội bảo mật) · **Mặc định:** 7
- **Ví dụ:** 7.
- **Ảnh hưởng:** Lưu trữ. **Đi kèm:** –
- **Đội đề xuất:** 7 – BR-913.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-retention-web-request-stale-days"></a>
#### `retention.web_request_stale_days` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** T19
- **Ý nghĩa:** Yêu cầu web không tiến triển bao nhiêu ngày thì xóa dữ liệu.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 7 đến 60 (biên cứng của đội bảo mật) · **Mặc định:** 30
- **Ví dụ:** 30.
- **Ảnh hưởng:** Lưu trữ yêu cầu web. **Đi kèm:** `retention.web_request_max_age_days`
- **Đội đề xuất:** 30 – BR-913 (biên SEC).
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-web-estimate-open-until"></a>
#### `web_estimate.open_until` [Giá]

- **Tên trên Desk:** Web hiện giá cho đêm trước ngày (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-115
- **Ý nghĩa:** Web chỉ hiện giá cho đêm trước ngày này. Đêm từ ngày này trở đi web ghi "giá theo yêu cầu".
- **Đơn vị:** Ngày (yyyy-mm-dd)
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** 2027-01-01
- **Ví dụ:** 2027-01-01: đêm 31/12/2026 có giá; đêm 01/01/2027 không có số.
- **Ảnh hưởng:** Web khách. **Đi kèm:** `public_show_prices`, `booking_window_days`, `special_dates`
- **Đội đề xuất:** 2027-01-01, gia hạn khi chủ đầu tư chốt giá cho năm 2027. – BR-115 (6): chỉ hiện số cho ngày đã chốt lịch giá.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Desk nhắc khi còn dưới 60 ngày. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-web-request-duplicate-window-hours"></a>
#### `web_request_duplicate_window_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-914
- **Ý nghĩa:** Hai yêu cầu giống nhau trong bao nhiêu giờ thì gộp là trùng.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 168 · **Mặc định:** 24
- **Ví dụ:** 24.
- **Ảnh hưởng:** Hàng chờ yêu cầu web. **Đi kèm:** –
- **Đội đề xuất:** 24 – BR-914.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-web-request-escalate-minutes"></a>
#### `web_request_escalate_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-912
- **Ý nghĩa:** Yêu cầu web chưa ai nhận sau bao nhiêu phút thì báo quản lý.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 10 đến 480 · **Mặc định:** 30
- **Ví dụ:** 30.
- **Ảnh hưởng:** Thông báo. **Đi kèm:** `web_request_response_minutes`
- **Đội đề xuất:** 30 – BR-912.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-web-request-public-promise-call-now-minutes"></a>
#### `web_request_public_promise_call_now_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-912
- **Ý nghĩa:** Yêu cầu cho đêm nay: câu hứa gọi lại trong bao nhiêu phút.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 5 đến 240 · **Mặc định:** 60
- **Ví dụ:** 60, luôn kèm số gọi.
- **Ảnh hưởng:** Web khách. **Đi kèm:** `web_request_same_day_after_hours_minutes`
- **Đội đề xuất:** 60 – BR-912.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-web-request-public-promise-minutes"></a>
#### `web_request_public_promise_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-912
- **Ý nghĩa:** Câu hứa trên trang cảm ơn: "chúng tôi liên hệ trong … phút".
- **Đơn vị:** Phút
- **Giới hạn:** Từ 15 đến 240 · **Mặc định:** 60
- **Ví dụ:** 60: khách thấy "within 60 minutes".
- **Ảnh hưởng:** Web khách. **Đi kèm:** `web_request_public_promise_next_morning_by`, `web_request_response_minutes`
- **Đội đề xuất:** 60 – BR-912 (INV duyệt chữ ở ESC-020).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Phải lớn hơn hạn nội bộ để đội kịp làm. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-web-request-public-promise-next-morning-by"></a>
#### `web_request_public_promise_next_morning_by`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-912
- **Ý nghĩa:** Gửi ngoài giờ trực: hứa liên hệ trước giờ này sáng hôm sau.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** 09:00
- **Ví dụ:** 09:00.
- **Ảnh hưởng:** Web khách. **Đi kèm:** `front_desk_hours`
- **Đội đề xuất:** 09:00 – BR-912.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-web-request-response-minutes"></a>
#### `web_request_response_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-912
- **Ý nghĩa:** Yêu cầu từ web phải được lễ tân nhận trong bao nhiêu phút (trong giờ trực).
- **Đơn vị:** Phút
- **Giới hạn:** Từ 5 đến 240 · **Mặc định:** 15
- **Ví dụ:** 15: yêu cầu 09:00 → nhận trước 09:15.
- **Ảnh hưởng:** Hàng chờ yêu cầu web, Cần chú ý. **Đi kèm:** `web_request_escalate_minutes`, `front_desk_hours`
- **Đội đề xuất:** 15 – BR-912. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-web-request-same-day-after-hours-minutes"></a>
#### `web_request_same_day_after_hours_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-912
- **Ý nghĩa:** Yêu cầu cho đêm nay gửi ngoài giờ trực: báo người trực trong bao nhiêu phút (nội bộ).
- **Đơn vị:** Phút
- **Giới hạn:** Từ 5 đến 240 · **Mặc định:** 30
- **Ví dụ:** 30.
- **Ảnh hưởng:** Thông báo người trực. **Đi kèm:** `web_request_public_promise_call_now_minutes`
- **Đội đề xuất:** 30 – BR-912.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Thuê tháng

<a id="k-deposit-refund-working-days"></a>
#### `deposit_refund_working_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-214
- **Ý nghĩa:** Hoàn ký quỹ thuê tháng trong bao nhiêu ngày làm việc sau khi trả phòng.
- **Đơn vị:** Ngày làm việc
- **Giới hạn:** Từ 0 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 7: trả phòng thứ Hai 30/11 → hoàn chậm nhất 09/12.
- **Ảnh hưởng:** Thanh lý hợp đồng, mẫu hợp đồng. **Đi kèm:** `early_termination`
- **Đội đề xuất:** 7 – INV-006 (BR-214).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-doc-code-format-lease-contract"></a>
#### `doc_code_format.lease_contract`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-007
- **Ý nghĩa:** Cách đánh số hợp đồng thuê tháng.
- **Đơn vị:** {prefix, padWidth, period, scope}
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** {"scope": "property", "period": "none", "prefix": "HD-", "padWidth": 5}
- **Ví dụ:** HD-00010.
- **Ảnh hưởng:** Số hợp đồng. **Đi kèm:** –
- **Đội đề xuất:** Giữ mặc định. – BR-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Số đã cấp không đổi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-early-termination"></a>
#### `early_termination` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-313
- **Ý nghĩa:** Khách thuê tháng trả phòng trước hạn hợp đồng mất bao nhiêu % ký quỹ.
- **Đơn vị:** Danh sách {minDays, forfeitPct}
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** [{"minDays":0,"forfeitPct":100}]: trả trước hạn → mất toàn bộ ký quỹ, không truy thu thêm.
- **Ảnh hưởng:** Thanh lý hợp đồng. **Đi kèm:** `lease_terms`, `deposit_refund_working_days`
- **Đội đề xuất:** [{"minDays":0,"forfeitPct":100}] – INV quyết ESC-045 câu 4 (01/11).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này; đội cập nhật ở bản sau. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-electricity-price"></a>
#### `electricity_price` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-501
- **Ý nghĩa:** Giá điện thu khách thuê tháng.
- **Đơn vị:** VND / kWh
- **Giới hạn:** Từ 0 đến 20.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 5.000: dùng 150 kWh → 750.000.
- **Ảnh hưởng:** Hóa đơn điện nước thuê tháng. **Đi kèm:** `water_price`, `meter_anomaly_factor`
- **Đội đề xuất:** 5.000 – INV 26/10 (BR-501) – cần kiểm quy định giá điện bán lại [PL].
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-foreigner-surcharge-pct"></a>
#### `foreigner_surcharge_pct` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-109
- **Ý nghĩa:** Phụ thu thuê tháng cho khách dùng hộ chiếu nước ngoài.
- **Đơn vị:** % giá tháng
- **Giới hạn:** Từ 0 đến 50 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 10 %: Studio City 8.500.000 → khách nước ngoài 9.350.000/tháng.
- **Ảnh hưởng:** Báo giá thuê tháng Desk. Không áp cho ngắn ngày. **Đi kèm:** `lease_terms`
- **Đội đề xuất:** 10 – INV quyết ESC-004 (BR-109).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-lease-renewal-offer-days"></a>
#### `lease_renewal_offer_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-211
- **Ý nghĩa:** Chào gia hạn hợp đồng trước ngày hết hạn bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 90 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30: HĐ hết 31/12 → chào gia hạn 01/12.
- **Ảnh hưởng:** Nhắc gia hạn HĐ. **Đi kèm:** –
- **Đội đề xuất:** 30 – BR-211. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-lease-terms"></a>
#### `lease_terms` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-201
- **Ý nghĩa:** Bảng kỳ hạn thuê tháng: giảm giá và ký quỹ theo số tháng ký. Trong bảng còn có cột hoa hồng (không ghi ở đây).
- **Đơn vị:** Danh sách theo kỳ hạn {months, discountPct, depositFactorVn, depositFactorForeign, billingCycleMonths, …}
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận danh sách 1–12 kỳ: `months` số nguyên 1–60, không trùng; `discountPct` 0–100, tối đa 2 chữ số thập phân. Các trường khác của kỳ Desk chưa kiểm. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Studio Garden 9.000.000, ký 4–6 tháng giảm 3 % → 8.730.000/tháng.
- **Ảnh hưởng:** Khối "So sánh: thuê 1 tháng" trong báo giá Desk (bản hiện tại chỉ đọc mức 1 tháng). **Đi kèm:** `long_stay_compare_from_nights`, `rounding.monthly_rent`, `foreigner_surcharge_pct`, `early_termination`
- **Đội đề xuất:** Theo bảng giá 01/11: 1–3 tháng 0 %; 4–6 tháng 3 %; 7–9 tháng 5 %; 10–23 tháng 7 %; từ 24 tháng 10 %. Ký quỹ 1 tháng (24 tháng: 2). Hoa hồng: theo bảng nội bộ của chủ đầu tư. – Bảng giá INV 01/11, ESC-045 câu 2. Desk hiện còn cấu trúc 5 mốc cũ; đội đổi cấu trúc ở bản sau (H7).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Chỉ chủ đầu tư. Không tự sửa bảng này; nhờ đội. Không gửi tỷ lệ hoa hồng cho đội. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-long-stay-daily-divisor"></a>
#### `long_stay_daily_divisor` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-102
- **Ý nghĩa:** Tiền thuê tháng chia cho số này ra giá một ngày (tính lẻ tháng đầu, tháng cuối).
- **Đơn vị:** Số ngày (28–31)
- **Giới hạn:** Từ 28 đến 31 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30: 8.500.000 ÷ 30 = 283.000/ngày; vào ở 20/11 → 11 ngày = 3.113.000.
- **Ảnh hưởng:** Tính lẻ thuê tháng, folio dài hạn. **Đi kèm:** `lease_terms`
- **Đội đề xuất:** 30 – BR-102, BR-210 (chuẩn ngành).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-meter-anomaly-default-kwh"></a>
#### `meter_anomaly_default_kwh` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-503
- **Ý nghĩa:** Căn chưa có lịch sử: vượt bao nhiêu kWh/tháng thì cảnh báo.
- **Đơn vị:** kWh
- **Giới hạn:** Từ 1 đến 5.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 300: tháng đầu dùng 350 kWh → cảnh báo.
- **Ảnh hưởng:** Ghi chỉ số. **Đi kèm:** `meter_anomaly_factor`
- **Đội đề xuất:** 300 – BR-503. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-meter-anomaly-default-m3"></a>
#### `meter_anomaly_default_m3` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-503
- **Ý nghĩa:** Căn chưa có lịch sử: vượt bao nhiêu m³ nước/tháng thì cảnh báo.
- **Đơn vị:** m³
- **Giới hạn:** Từ 1 đến 500 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 10: tháng đầu 12 m³ → cảnh báo.
- **Ảnh hưởng:** Ghi chỉ số. **Đi kèm:** `meter_anomaly_factor`
- **Đội đề xuất:** 10 – BR-503. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-meter-anomaly-factor"></a>
#### `meter_anomaly_factor` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-503
- **Ý nghĩa:** Chỉ số điện nước tháng này gấp bao nhiêu lần bình thường thì cảnh báo.
- **Đơn vị:** Lần
- **Giới hạn:** Từ 1 đến 10 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 2: thường 150 kWh, tháng này 320 kWh → cảnh báo.
- **Ảnh hưởng:** Ghi chỉ số. **Đi kèm:** `meter_anomaly_default_kwh`, `meter_anomaly_default_m3`
- **Đội đề xuất:** 2 – BR-503. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-night-from-month-divisor"></a>
#### `night_from_month_divisor` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-101 (5)
- **Ý nghĩa:** **Còn tác dụng ở đường gọi API, không ở thao tác trên Desk.** Khi một lệnh tạo căn hoặc đổi giá căn **không gửi giá đêm**, máy chủ tự tính giá đêm = giá tháng ÷ số này, làm tròn theo `rounding.night_rate`, và **không cảnh báo** (BUG-R4-057). Ba đường đi qua khóa này: (1) lệnh đổi giá căn qua API chỉ gửi giá tháng; (2) lệnh tạo căn mới qua API (bản hiện tại chưa nhận giá đêm, luôn tính theo khóa này); (3) công cụ nhập danh mục căn. Trên Desk, màn **Danh mục căn** luôn gửi đủ giá tháng và giá đêm, nên anh/chị sửa giá trên Desk không đi đường này.
- **Đơn vị:** Số (chia giá tháng)
- **Giới hạn:** Từ 1 đến 31 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12: căn 102 giá tháng 9.000.000, một lệnh API đổi giá chỉ gửi giá tháng → máy chủ ghi giá đêm 9.000.000 ÷ 12 = **750.000**, trong khi bảng giá 01/11 là **800.000**. Báo giá Desk và giá web 2 đêm thành 1.500.000 thay vì 1.600.000, không có thông báo nào.
- **Ảnh hưởng:** Giá đêm niêm yết của căn khi căn được tạo hoặc đổi giá ngoài Desk mà thiếu giá đêm → báo giá Desk, giá ước tính trên web, đơn OTA để trống giá, phiếu thanh toán. **Đi kèm:** `rounding.night_rate`
- **Đội đề xuất:** Giữ **12**, không sửa. – Đổi số này không làm giá đúng hơn; cách đúng là mọi lệnh đổi giá luôn gửi đủ hai giá. v1.0.5 (V5-1A, #121) gỡ đường này: thiếu giá đêm thì máy chủ báo lỗi (422), tạo căn và công cụ nhập danh mục nhận giá đêm. Từ v1.0.5 khóa không còn được đọc; sửa số này không đổi gì. Khóa còn hiện trên màn Tham số tới khi đội dọn.
- **Lưu ý khi sửa:** **Không sửa.** Sửa số này đổi giá đêm của mọi căn tạo mới hoặc đổi giá qua API mà thiếu giá đêm. Tới khi v1.0.5 lên: (a) script của đội gọi API đổi giá luôn gửi đủ hai giá và đọc lại giá sau khi ghi; (b) căn mới tạo bằng API hoặc công cụ nhập danh mục thì ngay sau đó anh/chị mở **Danh mục căn**, kiểm và nhập lại giá đêm theo bảng giá. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rent-overdue-alert-days"></a>
#### `rent_overdue_alert_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-207
- **Ý nghĩa:** Quá hạn đóng tiền thuê bao nhiêu ngày thì báo lễ tân.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 3: hạn 05/12, chưa đóng → báo 08/12.
- **Ảnh hưởng:** Cần chú ý. **Đi kèm:** `rent_reminder_days`, `rent_overdue_escalate_days`
- **Đội đề xuất:** 3 – BR-207. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rent-overdue-escalate-days"></a>
#### `rent_overdue_escalate_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-207
- **Ý nghĩa:** Quá hạn bao nhiêu ngày thì báo quản lý, chủ đầu tư.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 60 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 10: hạn 05/12 → báo lên 15/12.
- **Ảnh hưởng:** Cần chú ý. **Đi kèm:** `rent_overdue_alert_days`
- **Đội đề xuất:** 10 – BR-207. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rent-reminder-days"></a>
#### `rent_reminder_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-207
- **Ý nghĩa:** Nhắc khách thuê tháng đóng tiền trước hạn bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 7: hạn ngày 05/12 → nhắc 28/11.
- **Ảnh hưởng:** Nhắc thu tiền thuê. **Đi kèm:** `rent_overdue_alert_days`, `rent_overdue_escalate_days`
- **Đội đề xuất:** 7 – BR-207 (hạn ngày 05 theo ESC-045 câu 5). [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-rounding-monthly-rent"></a>
#### `rounding.monthly_rent` [Giá]

- **Tên trên Desk:** Làm tròn tiền thuê tháng (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-005
- **Ý nghĩa:** Tiền thuê tháng sau giảm được làm tròn tới bội số nào.
- **Đơn vị:** VND (1, 100, 1.000, 10.000, 100.000)
- **Giới hạn:** Chỉ nhận: 1, 100, 1.000, 10.000, 100.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 1.000: 9.000.000 × 0,97 = 8.730.000 (giữ nguyên); 9.900.000 × 0,97 = 9.603.000.
- **Ảnh hưởng:** Báo giá thuê tháng trên Desk. **Đi kèm:** `lease_terms`, `rounding.ota_rate`
- **Đội đề xuất:** 1.000 – Bảng giá INV 01/11: mọi số tiền sau giảm làm tròn 1.000 (BR-005 v0.5.0).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-utility-bill-due-days"></a>
#### `utility_bill_due_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-504
- **Ý nghĩa:** Hạn đóng tiền điện nước sau khi chốt chỉ số bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 5: chốt 30/11 → hạn 05/12.
- **Ảnh hưởng:** Hóa đơn điện nước. **Đi kèm:** `electricity_price`
- **Đội đề xuất:** 5 – BR-504. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-utility-estimate"></a>
#### `utility_estimate` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-205
- **Ý nghĩa:** Mức điện, nước ước tính mỗi người mỗi tháng (dùng để chào giá thuê tháng).
- **Đơn vị:** {vn, foreign}: kWh/người; m³/người (×10)
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Khách VN 120 kWh, 3,5 m³ mỗi người; khách nước ngoài 170 kWh, 4 m³.
- **Ảnh hưởng:** Báo giá thuê tháng. **Đi kèm:** `electricity_price`, `water_price`
- **Đội đề xuất:** Như ví dụ. – BR-205. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-water-price"></a>
#### `water_price` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-501
- **Ý nghĩa:** Tiền nước thu khách thuê tháng.
- **Đơn vị:** VND / người / tháng
- **Giới hạn:** Từ 0 đến 200.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 100.000: 2 người → 200.000/tháng.
- **Ảnh hưởng:** Hóa đơn điện nước thuê tháng. **Đi kèm:** `electricity_price`
- **Đội đề xuất:** 100.000 – INV 26/10 (BR-501, đổi nghĩa từ đ/m³ sang đ/người/tháng).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Nhận/trả phòng và lưu trú

<a id="k-checkout-reminders"></a>
#### `checkout_reminders`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-425
- **Ý nghĩa:** Lịch nhắc lễ tân về khách sắp trả phòng và quá giờ trả.
- **Đơn vị:** Danh sách giờ
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận {before, overdueWithSameDayArrival, overdueOtherwise}: `before` tối đa 6 mốc HH:mm hoặc HH:mm-1d, không trùng; hai giờ quá hạn dạng HH:mm. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Trước: 20:00 hôm trước, 09:00, 11:00. Quá giờ: 12:00 nếu căn có khách đến hôm nay, 12:31 nếu không.
- **Ảnh hưởng:** Mục Cần chú ý trên Desk. **Đi kèm:** `checkout_time`, `late_grace_until`
- **Đội đề xuất:** {"before":["20:00-1d","09:00","11:00"],"overdueWithSameDayArrival":"12:00","overdueOtherwise":"12:31"} – BR-425. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-early-checkin-tiers"></a>
#### `early_checkin_tiers` [Giá]

- **Tên trên Desk:** Bậc phụ thu nhận phòng sớm (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-411
- **Ý nghĩa:** Bậc phụ thu nhận phòng sớm theo giờ (tính % giá một đêm).
- **Đơn vị:** Danh sách {from, to: giờ hh:mm, pct: %}
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận tối đa 10 bậc {from, to, pct}: giờ dạng HH:mm, `from` trước `to`, các bậc không chồng nhau; `pct` 0–100, tối đa 2 chữ số thập phân. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Studio 800.000: nhận 10:30 → 30 % = 240.000; 08:00 → 50 % = 400.000; 11:00 → 0 đ.
- **Ảnh hưởng:** Màn nhận phòng, hóa đơn. **Đi kèm:** `checkin_time`, `rounding.fee`, `ota_surcharge_base`
- **Đội đề xuất:** [{"from":"10:00","to":"11:00","pct":30},{"from":"06:00","to":"10:00","pct":50}] – Bảng giá INV 01/11: nhận sớm miễn phí từ 11:00 (BR-411).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Khoảng giờ không được chồng nhau. Trước 06:00 không phụ thu theo bậc, xử lý theo BR-417. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-early-departure-refund"></a>
#### `early_departure_refund` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-428
- **Ý nghĩa:** Khách ngắn ngày trả phòng sớm được hoàn bao nhiêu.
- **Đơn vị:** {minNoticeDays: số ngày báo trước, refundPct: %}
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận {minNoticeDays, refundPct}: `minNoticeDays` số nguyên 0–365; `refundPct` 0–100, tối đa 2 chữ số thập phân. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Báo trước ≥ 1 ngày: 7 đêm 5.600.000, ở 3 đêm, bỏ 4 đêm 3.200.000 → hoàn 1.600.000. Báo trong ngày rời → 0.
- **Ảnh hưởng:** Nút Trả sớm, yêu cầu hoàn. **Đi kèm:** –
- **Đội đề xuất:** {"minNoticeDays":1,"refundPct":50} – INV quyết ESC-006 (BR-428).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-extension-max-nights"></a>
#### `extension_max_nights`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-421
- **Ý nghĩa:** Gia hạn ngắn ngày tối đa bao nhiêu đêm mỗi lần.
- **Đơn vị:** Số đêm
- **Giới hạn:** Từ 0 đến 27 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 7: khách đang ở xin thêm 9 đêm → Desk chặn, làm đơn mới hoặc thuê tháng.
- **Ảnh hưởng:** Màn gia hạn. **Đi kèm:** `short_stay_max_nights`
- **Đội đề xuất:** 7 – BR-421. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-extension-payment-deadline"></a>
#### `extension_payment_deadline` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-423
- **Ý nghĩa:** Hạn thu tiền phần gia hạn.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 14:00 ngày đầu của phần gia hạn.
- **Ảnh hưởng:** Nhắc thu tiền. **Đi kèm:** `extension_max_nights`
- **Đội đề xuất:** 14:00 – BR-423. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-front-desk-hours"></a>
#### `front_desk_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-811
- **Ý nghĩa:** Giờ quầy có người trực.
- **Đơn vị:** Khoảng giờ [từ, đến)
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** ["07:00","22:00"]: yêu cầu gửi 23:00 tính từ 07:00 sáng sau.
- **Ảnh hưởng:** Hạn trả lời yêu cầu web và trang khách, chữ hứa trên web. **Đi kèm:** `guest_request_response_minutes`, `web_request_response_minutes`
- **Đội đề xuất:** ["07:00","22:00"] – BR-811. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-guest-request-response-minutes"></a>
#### `guest_request_response_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-811
- **Ý nghĩa:** Yêu cầu từ trang khách phải được trả lời trong bao nhiêu phút (trong giờ trực).
- **Đơn vị:** Phút
- **Giới hạn:** Từ 1 đến 120 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 10.
- **Ảnh hưởng:** Cần chú ý. **Đi kèm:** `front_desk_hours`
- **Đội đề xuất:** 10 – BR-811. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-late-checkout-tiers"></a>
#### `late_checkout_tiers` [Giá]

- **Tên trên Desk:** Bậc phụ thu trả phòng muộn (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-412
- **Ý nghĩa:** Bậc phụ thu trả phòng muộn theo giờ (tính % giá một đêm).
- **Đơn vị:** Danh sách {after, until: giờ, pct: %}
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận tối đa 10 bậc {after, until, pct}: giờ dạng HH:mm, `after` trước `until` (giờ trước mốc đổi ngày nghiệp vụ tính là sáng hôm sau), các bậc không chồng nhau; `pct` 0–100, tối đa 2 chữ số thập phân. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Studio 800.000: trả 14:00 → 30 % = 240.000; 17:00 → 50 % = 400.000; sau 18:00 → gia hạn 1 đêm.
- **Ảnh hưởng:** Màn trả phòng, hóa đơn. **Đi kèm:** `checkout_time`, `late_grace_until`, `rounding.fee`
- **Đội đề xuất:** [{"after":"12:00","until":"15:00","pct":30},{"after":"15:00","until":"18:00","pct":50}] – INV-007 (BR-412).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-late-grace-requires-no-same-day-arrival"></a>
#### `late_grace_requires_no_same_day_arrival` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-412
- **Ý nghĩa:** Chỉ cho ân hạn khi căn không có khách mới đến trong ngày.
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Bật: căn có khách đến hôm nay → trả 12:20 vẫn tính từ 12:00.
- **Ảnh hưởng:** Màn trả phòng. **Đi kèm:** `late_grace_until`
- **Đội đề xuất:** Bật (true) – INV-007.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-long-stay-free-late-until"></a>
#### `long_stay_free_late_until` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-413
- **Ý nghĩa:** Khách thuê tháng trả phòng muộn miễn phí tới giờ này (nếu không có khách đến).
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 15:00: khách HĐ tháng trả 14:30 → 0 đ.
- **Ảnh hưởng:** Màn trả phòng đơn dài hạn. **Đi kèm:** `late_checkout_tiers`
- **Đội đề xuất:** 15:00 – INV-007 (BR-413).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-manual-time-tolerance-minutes"></a>
#### `manual_time_tolerance_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-414
- **Ý nghĩa:** Giờ nhận/trả lễ tân gõ tay được lệch so với lúc bấm tối đa bao nhiêu phút.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 5 đến 240 · **Mặc định:** 30
- **Ví dụ:** 30: bấm lúc 13:00 mà gõ giờ trả 12:00 → phải ghi chú, vào báo cáo đóng ca.
- **Ảnh hưởng:** Màn nhận phòng, trả phòng. **Đi kèm:** –
- **Đội đề xuất:** 30 – BR-414 (chuẩn ngành).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-no-show-auto"></a>
#### `no_show_auto` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-311
- **Ý nghĩa:** Tự đánh dấu no-show khi tới giờ (không cần lễ tân bấm).
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** tắt
- **Ví dụ:** Tắt: lễ tân tự bấm sau khi đã gọi.
- **Ảnh hưởng:** Đơn no-show. **Đi kèm:** `no_show_mark_time`
- **Đội đề xuất:** Tắt (false) – Mặc định danh mục; lễ tân gọi khách trước.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-ota-surcharge-base"></a>
#### `ota_surcharge_base` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-415
- **Ý nghĩa:** Phụ thu nhận sớm, trả muộn của đơn OTA tính trên giá nào.
- **Đơn vị:** Chữ (lựa chọn hệ thống)
- **Giới hạn:** Không có giới hạn số. Desk chỉ kiểm là chữ (tối đa 500 ký tự), chưa kiểm có đúng một giá trị trong danh sách: gõ sai chữ Desk vẫn lưu. Chép đúng chữ ở mục Ví dụ. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "direct_current_rate": khách Booking giá 820.000, giá Trực tiếp đêm đó 800.000 → phụ thu 30 % = 240.000.
- **Ảnh hưởng:** Phụ thu đơn OTA. **Đi kèm:** `early_checkin_tiers`, `late_checkout_tiers`
- **Đội đề xuất:** direct_current_rate – INV-007 (BR-415).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại đọc cố định theo cách này; sửa tham số chưa có tác dụng. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-post-checkout-charge-hours"></a>
#### `post_checkout_charge_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-427
- **Ý nghĩa:** Sau khi trả phòng, còn được thêm khoản thu (minibar, hư hỏng) trong bao nhiêu giờ.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 0 đến 72 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 24: trả phòng 11:00 hôm nay → tới 11:00 mai còn ghi được phí phát hiện muộn.
- **Ảnh hưởng:** Folio sau trả phòng, xem lại phí trả muộn. **Đi kèm:** –
- **Đội đề xuất:** 24 – INV-007 (BR-427).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-room-move-pricing"></a>
#### `room_move_pricing` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-429
- **Ý nghĩa:** Đổi căn theo yêu cầu khách thì tính giá căn mới hay giữ giá cũ.
- **Đơn vị:** Chữ trong ngoặc {guestRequest: …}
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** {"guestRequest": "new_room_rate"}
- **Ví dụ:** {"guestRequest":"new_room_rate"}: khách xin chuyển Studio 800.000 lên Premium 1.100.000 → các đêm còn lại tính 1.100.000. Do OTTIMO đổi → giữ giá cũ.
- **Ảnh hưởng:** Màn đổi căn, folio. **Đi kèm:** –
- **Đội đề xuất:** {"guestRequest":"new_room_rate"} – INV-019 (BR-429).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Chỉ chủ đầu tư sửa. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Giữ chỗ, cọc, hủy

<a id="k-cancel-peak-no-refund"></a>
#### `cancel_peak_no_refund` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-309
- **Ý nghĩa:** Đơn có ít nhất 1 đêm ngày đặc biệt thì không hoàn cọc khi hủy.
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Bật: đơn 31/12–02/01 hủy trước 10 ngày → không hoàn.
- **Ảnh hưởng:** Hủy đơn. **Đi kèm:** `special_dates`, `cancel_policy_direct`
- **Đội đề xuất:** Bật (true) – INV-006.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-cancel-policy-direct"></a>
#### `cancel_policy_direct` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-309
- **Ý nghĩa:** Hoàn cọc khi khách Trực tiếp/CTV hủy, theo số ngày báo trước.
- **Đơn vị:** Danh sách {minDays, refundPct}
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận 1–10 bậc {minDays, refundPct}: `minDays` số nguyên 0–365, không trùng; `refundPct` 0–100, tối đa 2 chữ số thập phân. Không nhận `[]`; không hoàn hẳn thì ghi `[{"minDays":0,"refundPct":0}]`. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Cọc 500.000: hủy trước ≥ 7 ngày → hoàn 500.000; 3–6 ngày → 250.000; dưới 3 ngày → 0.
- **Ảnh hưởng:** Nút hủy đơn, yêu cầu hoàn, chính sách trên mẫu tin. **Đi kèm:** `cancel_peak_no_refund`, `reschedule_max_times`
- **Đội đề xuất:** ≥ 7 ngày 100 %; 3–6 ngày 50 %; < 3 ngày 0 % – INV quyết ESC-006 (BR-309).
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Đơn đã tạo giữ chính sách lúc tạo (BR-006). Đổi thì sửa cả chữ chính sách trên web, mẫu tin. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-force-majeure-reschedule-months"></a>
#### `force_majeure_reschedule_months` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-309
- **Ý nghĩa:** Bất khả kháng (thiên tai, dịch…): được dời miễn phí trong bao nhiêu tháng.
- **Đơn vị:** Tháng
- **Giới hạn:** Từ 0 đến 12 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 3: bão làm khách không tới → dời trong 3 tháng, giữ cọc, quản lý duyệt.
- **Ảnh hưởng:** Đổi ngày đơn. **Đi kèm:** `reschedule_window_months`
- **Đội đề xuất:** 3 – INV-006.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này; quản lý xử lý tay. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-group-min-rooms"></a>
#### `group_min_rooms` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-324
- **Ý nghĩa:** Từ bao nhiêu căn thì tính là đơn nhóm.
- **Đơn vị:** Số căn
- **Giới hạn:** Từ 2 đến 10 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 2: một khách đặt 2 căn → đơn nhóm.
- **Ảnh hưởng:** Đơn nhóm. **Đi kèm:** `group_rooming_list_days`
- **Đội đề xuất:** 2 – INV-006 (BR-324).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-group-rooming-list-days"></a>
#### `group_rooming_list_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-323
- **Ý nghĩa:** Đơn nhóm phải gửi danh sách người ở trước ngày đến bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 3: nhóm đến 20/11 → gửi danh sách trước 17/11.
- **Ảnh hưởng:** Đơn nhóm. **Đi kèm:** `group_min_rooms`
- **Đội đề xuất:** 3 – INV-006 (BR-323).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-hold-latest-time-on-arrival"></a>
#### `hold_latest_time_on_arrival`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-302
- **Ý nghĩa:** Giữ chỗ luôn hết hạn chậm nhất vào giờ này của ngày đến.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12:00: khách đến 10/11, giữ 48 giờ từ 9/11 08:00 → vẫn hết hạn 10/11 12:00.
- **Ảnh hưởng:** Giữ chỗ, báo giá. **Đi kèm:** `hold_hours_default`, `checkin_time`
- **Đội đề xuất:** 12:00 – Bằng `checkin_time` (BR-302).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-max-open-holds-per-user"></a>
#### `max_open_holds_per_user`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC-BE-28
- **Ý nghĩa:** Mỗi sale/CTV được mở tối đa bao nhiêu giữ chỗ cùng lúc.
- **Đơn vị:** {sales_staff: số, collaborator: số}
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận {collaborator, sales_staff}, đủ cả hai vai: số nguyên 0–50 (0 = vai đó không được giữ chỗ). · **Mặc định:** {"sales_staff": 5, "collaborator": 3}
- **Ví dụ:** CTV 3: CTV đang có 3 giữ chỗ chưa cọc → không tạo được giữ chỗ thứ 4.
- **Ảnh hưởng:** Giữ chỗ trên Desk. **Đi kèm:** –
- **Đội đề xuất:** Sale 5, CTV 3; lễ tân trở lên không giới hạn. – INV-017 (SEC BE-28).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-no-deposit-hold-until"></a>
#### `no_deposit_hold_until` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-527
- **Ý nghĩa:** Đơn không cọc chỉ giữ căn tới giờ này ngày đến.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 18:00: khách không cọc chưa tới 18:00 → được bán căn cho khách khác.
- **Ảnh hưởng:** Đơn không cọc. **Đi kèm:** `no_deposit_max_lead_days`
- **Đội đề xuất:** 18:00 – BR-527.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-no-deposit-max-lead-days"></a>
#### `no_deposit_max_lead_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-527
- **Ý nghĩa:** Khách không cọc online được: chỉ nhận đơn không cọc nếu ngày đến cách hôm nay tối đa bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 7 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 2: hôm nay 06/11 → nhận đơn không cọc cho ngày đến tới 08/11, quản lý duyệt.
- **Ảnh hưởng:** Tạo đơn không cọc. **Đi kèm:** `no_deposit_hold_until`
- **Đội đề xuất:** 2 – BR-527 (chuẩn ngành).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-reschedule-max-times"></a>
#### `reschedule_max_times`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-309
- **Ý nghĩa:** Thay vì hoàn cọc, được dời ngày tối đa mấy lần.
- **Đơn vị:** Số lần
- **Giới hạn:** Từ 0 đến 5 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 1: dời một lần, lần sau không dời nữa.
- **Ảnh hưởng:** Đổi ngày đơn. **Đi kèm:** `reschedule_window_months`
- **Đội đề xuất:** 1 – INV-006.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-reschedule-window-months"></a>
#### `reschedule_window_months`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-309
- **Ý nghĩa:** Ngày đến mới phải nằm trong bao nhiêu tháng kể từ ngày đến cũ.
- **Đơn vị:** Tháng
- **Giới hạn:** Từ 0 đến 12 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 3: ngày đến cũ 10/11/2026 → ngày mới không muộn hơn 10/02/2027.
- **Ảnh hưởng:** Đổi ngày đơn. **Đi kèm:** `reschedule_max_times`
- **Đội đề xuất:** 3 – INV-006.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Phí, phạt, dịch vụ

<a id="k-adhoc-cleaning-fee"></a>
#### `adhoc_cleaning_fee` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-506
- **Ý nghĩa:** Phí dọn phòng thêm theo yêu cầu (ngoài lịch dọn).
- **Đơn vị:** VND / lượt
- **Giới hạn:** Từ 0 đến 5.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 100.000: khách ngắn ngày xin dọn thêm buổi chiều → 100.000.
- **Ảnh hưởng:** Yêu cầu từ trang khách, folio. **Đi kèm:** –
- **Đội đề xuất:** 100.000 – INV-005 (BR-506). Khách thuê tháng: phí dọn theo hạng có khóa riêng từ v1.0.5 (H3, V5-31 – xem mục [Sắp có ở v1.0.5](#sap-co-v105)); tới khi anh/chị nhập khóa đó, lễ tân thêm dòng phí phần chênh.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-damage-catalog"></a>
#### `damage_catalog` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-512
- **Ý nghĩa:** Bảng giá đền bù đồ hư/mất.
- **Đơn vị:** Danh sách {code, name, priceVnd}
- **Giới hạn:** Desk v1.0.4 **chưa** kiểm dạng khi lưu: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc tính (có khi lỗi cả màn). Từ v1.0.5 (V5-25) Desk chỉ nhận danh sách tối đa 100 món {code, name, priceVnd}: `code` chữ thường không dấu, số, gạch dưới (1–40 ký tự), không trùng; `name` không rỗng, tối đa 100 ký tự, không trùng; `priceVnd` số nguyên 1.000–20.000.000. Món đắt hơn hay ngoài bảng: quản lý định giá, có ảnh (BR-512). `[]` = chưa có bảng. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Khăn tắm 150.000; ly 50.000; remote 200.000.
- **Ảnh hưởng:** Folio, bill. **Đi kèm:** –
- **Đội đề xuất:** Như ví dụ (tạm). – BR-512 – chờ chủ đầu tư gửi bảng đền bù (ESC-008). [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Món ngoài bảng: quản lý định giá, có ảnh. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-key-card-fee"></a>
#### `key_card_fee` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-511
- **Ý nghĩa:** Phí mất/hỏng một thẻ phòng.
- **Đơn vị:** VND / thẻ
- **Giới hạn:** Từ 0 đến 5.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 200.000: phát 2 thẻ, trả 1 → 200.000.
- **Ảnh hưởng:** Folio lúc trả phòng. **Đi kèm:** `key_cards_per_booking`
- **Đội đề xuất:** 200.000 – BR-511. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-key-cards-per-booking"></a>
#### `key_cards_per_booking` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-511
- **Ý nghĩa:** Mỗi căn được phát tối đa bao nhiêu thẻ.
- **Đơn vị:** Thẻ
- **Giới hạn:** Từ 1 đến 10 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 2: 1 chính + 1 dự phòng.
- **Ảnh hưởng:** Nhận phòng. **Đi kèm:** `key_card_fee`
- **Đội đề xuất:** 2 – BR-511.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-laundry-price-per-kg"></a>
#### `laundry_price_per_kg` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-507
- **Ý nghĩa:** Giá giặt đồ.
- **Đơn vị:** VND / kg
- **Giới hạn:** Từ 0 đến 1.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30.000: 3 kg → 90.000.
- **Ảnh hưởng:** Folio, dịch vụ giặt. **Đi kèm:** –
- **Đội đề xuất:** 30.000 (tạm) – BR-507 – chờ chủ đầu tư gửi bảng giá. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-smoking-fee"></a>
#### `smoking_fee` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-511
- **Ý nghĩa:** Phí khử mùi khi hút thuốc trong phòng.
- **Đơn vị:** VND / lần
- **Giới hạn:** Từ 0 đến 20.000.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 500.000: có bằng chứng hút trong phòng → ghi 500.000 dòng Phí phạt.
- **Ảnh hưởng:** Folio. **Đi kèm:** –
- **Đội đề xuất:** 500.000 – BR-511. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Chỉ thu khi nội quy đã gửi khách và có trên OTA. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Tiền, thuế, hóa đơn

<a id="k-bank-reconcile-alert-days"></a>
#### `bank_reconcile_alert_days`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-527
- **Ý nghĩa:** Chuyển khoản ghi tay quá bao nhiêu ngày chưa đối soát thì báo.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 2: ghi 06/11, tới 08/11 chưa tick đối soát → Cần chú ý.
- **Ảnh hưởng:** Nhật ký tiền, Cần chú ý. **Đi kèm:** `staff_payment_backdate_max_hours`
- **Đội đề xuất:** 2 – BR-527. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-business-entity-type"></a>
#### `business_entity_type` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-524
- **Ý nghĩa:** Loại pháp nhân thu tiền (doanh nghiệp hay cá nhân).
- **Đơn vị:** Chữ: enterprise / individual
- **Giới hạn:** Không có giới hạn số. Desk chỉ kiểm là chữ (tối đa 500 ký tự), chưa kiểm có đúng một giá trị trong danh sách: gõ sai chữ Desk vẫn lưu. Chép đúng chữ ở mục Ví dụ. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "enterprise": xuất hóa đơn GTGT của công ty.
- **Ảnh hưởng:** Hóa đơn. **Đi kèm:** `vat_rate`
- **Đội đề xuất:** enterprise – INV-TT (BR-524) – cần kế toán xác nhận [PL].
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-cash-variance-requires-reason"></a>
#### `cash_variance_requires_reason` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-526
- **Ý nghĩa:** Chênh lệch tiền mặt khi đóng ca phải ghi lý do.
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Bật: két thiếu 20.000 → phải ghi lý do mới đóng ca.
- **Ảnh hưởng:** Đóng ca. **Đi kèm:** `shift_max_hours`
- **Đội đề xuất:** Bật (true) – BR-526 (chuẩn ngành).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại luôn bắt ghi lý do; sửa tham số chưa có tác dụng. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-debt-default-due-days"></a>
#### `debt_default_due_days`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-525
- **Ý nghĩa:** Khoản ghi nợ (khách trả sau) có hạn bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 30 · **Mặc định:** 3
- **Ví dụ:** 3: ghi nợ 06/11 → hạn 09/11.
- **Ảnh hưởng:** Trả phòng còn nợ, Cần chú ý. **Đi kèm:** –
- **Đội đề xuất:** 3 – INV xác nhận 22/10 (BR-525).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-doc-code-format-bill"></a>
#### `doc_code_format.bill`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-007
- **Ý nghĩa:** Cách đánh số phiếu thanh toán (bill).
- **Đơn vị:** {prefix, padWidth, period, scope}
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** {"scope": "property", "period": "year", "prefix": "F{yy}-", "padWidth": 6}
- **Ví dụ:** F26-000123: tiền tố "F{yy}-", 6 chữ số, đếm lại mỗi năm.
- **Ảnh hưởng:** Số in trên bill. **Đi kèm:** `doc_code_format.payment`
- **Đội đề xuất:** Giữ mặc định. – BR-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ đổi đầu năm hoặc khi kế toán yêu cầu; số đã cấp không đổi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-doc-code-format-guest"></a>
#### `doc_code_format.guest`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-007
- **Ý nghĩa:** Cách đánh số hồ sơ khách.
- **Đơn vị:** {prefix, padWidth, period, scope}
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** {"scope": "organization", "period": "none", "prefix": "KH-", "padWidth": 4}
- **Ví dụ:** KH-0251.
- **Ảnh hưởng:** Mã khách trên Desk. **Đi kèm:** –
- **Đội đề xuất:** Giữ mặc định. – BR-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Số đã cấp không đổi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-doc-code-format-payment"></a>
#### `doc_code_format.payment`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-007
- **Ý nghĩa:** Cách đánh số phiếu thu.
- **Đơn vị:** {prefix, padWidth, period, scope}
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** {"scope": "property", "period": "none", "prefix": "PT-", "padWidth": 6}
- **Ví dụ:** PT-000045.
- **Ảnh hưởng:** Số phiếu thu. **Đi kèm:** `doc_code_format.bill`
- **Đội đề xuất:** Giữ mặc định. – BR-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Số đã cấp không đổi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-doc-code-format-quote"></a>
#### `doc_code_format.quote`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-007
- **Ý nghĩa:** Cách đánh số báo giá.
- **Đơn vị:** {prefix, padWidth, period, scope}
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** {"scope": "property", "period": "none", "prefix": "BG-", "padWidth": 5}
- **Ví dụ:** BG-00012.
- **Ảnh hưởng:** Số báo giá, mẫu tin. **Đi kèm:** –
- **Đội đề xuất:** Giữ mặc định. – BR-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Số đã cấp không đổi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-doc-code-format-reservation"></a>
#### `doc_code_format.reservation`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-007
- **Ý nghĩa:** Cách đánh số đơn đặt phòng.
- **Đơn vị:** {prefix, padWidth, period, scope}
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** {"scope": "property", "period": "none", "prefix": "OTM-", "padWidth": 5}
- **Ví dụ:** OTM-00087.
- **Ảnh hưởng:** Mã đơn trên Desk, mẫu tin, trang khách. **Đi kèm:** –
- **Đội đề xuất:** Giữ mặc định. – BR-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Số đã cấp không đổi. Khách đọc mã này khi gọi – đổi tiền tố làm khách bối rối. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-doc-code-format-reservation-group"></a>
#### `doc_code_format.reservation_group`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-007
- **Ý nghĩa:** Cách đánh số đơn nhóm.
- **Đơn vị:** {prefix, padWidth, period, scope}
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** {"scope": "property", "period": "none", "prefix": "NH-", "padWidth": 5}
- **Ví dụ:** NH-00003.
- **Ảnh hưởng:** Mã đơn nhóm. **Đi kèm:** –
- **Đội đề xuất:** Giữ mặc định. – BR-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Số đã cấp không đổi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-fx-usd-vnd"></a>
#### `fx_usd_vnd` [Giá]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-004
- **Ý nghĩa:** Tỷ giá để in số USD tham khảo trên bill.
- **Đơn vị:** VND / 1 USD
- **Giới hạn:** Từ 10.000 đến 100.000 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 26.200: bill 13.908.000 đ ghi kèm ≈ 530,8 USD.
- **Ảnh hưởng:** Bill khách nước ngoài. **Đi kèm:** –
- **Đội đề xuất:** Cập nhật tay theo ngân hàng, ghi ngày cập nhật. – BR-004. Chỉ để tham khảo; thu tiền luôn bằng VND.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-payment-receiving-account"></a>
#### `payment_receiving_account`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-521
- **Ý nghĩa:** Tài khoản ngân hàng nhận chuyển khoản; mọi mã VietQR khách quét đều chuyển vào đây.
- **Đơn vị:** Thông tin tài khoản (không ghi ở tài liệu)
- **Giới hạn, mặc định, ví dụ:** không ghi ở tài liệu này (hoa hồng hoặc thông tin tài khoản).
- **Ảnh hưởng:** Mã VietQR trên Desk, mẫu tin, bill. **Đi kèm:** –
- **Đội đề xuất:** Chủ đầu tư tự nhập trên Desk. – BR-521.
- **Lưu ý khi sửa:** Chỉ chủ đầu tư. Sửa ở khối "Tài khoản nhận chuyển khoản (VietQR)", phải nhập lại mật khẩu và mã 2 bước, hiệu lực sớm nhất từ ngày làm việc sau. Kiểm khối này mỗi sáng; thấy dòng "Đã lên lịch" lạ thì Hủy lịch ngay. Ai sửa: Chủ đầu tư. Cần nhập lại mật khẩu và mã 2 bước.

<a id="k-prices-include-vat"></a>
#### `prices_include_vat` [Giá]

- **Tên trên Desk:** Giá niêm yết đã gồm VAT (hiện từ v1.0.5; v1.0.4 hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-523
- **Ý nghĩa:** Giá niêm yết đã gồm thuế VAT hay chưa.
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Bật: giá 800.000 đã gồm VAT; hóa đơn tách ngược ra phần thuế.
- **Ảnh hưởng:** Web ("đã gồm thuế"), hóa đơn, bill. **Đi kèm:** `vat_rate`
- **Đội đề xuất:** Bật (true) – INV-008, INV 26/10.
- **Lưu ý khi sửa:** Đơn, báo giá, hợp đồng đã tạo trước ngày hiệu lực giữ số cũ (BR-006). Sau khi lưu, báo giá thử một ca trên Desk (không lưu báo giá). Chỉ chủ đầu tư sửa. Đổi thì mọi giá trên web và bill đổi nghĩa – hỏi kế toán trước. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-shift-max-hours"></a>
#### `shift_max_hours` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-526
- **Ý nghĩa:** Một ca dài tối đa bao nhiêu giờ trước khi Desk nhắc đóng ca.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 24 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12: mở ca 07:00, 19:00 chưa đóng → nhắc.
- **Ảnh hưởng:** Đóng ca. **Đi kèm:** `cash_variance_requires_reason`
- **Đội đề xuất:** Chưa có mức (chủ đầu tư quyết theo lịch ca). – BR-526 chưa có số.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-staff-payment-backdate-max-hours"></a>
#### `staff_payment_backdate_max_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-527
- **Ý nghĩa:** Sale/CTV khai giờ nhận tiền được lùi tối đa bao nhiêu giờ.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 0 đến 72 · **Mặc định:** 24
- **Ví dụ:** 24: 10:00 hôm nay khai khoản nhận 09:00 hôm qua được; nhận từ 2 ngày trước thì không.
- **Ảnh hưởng:** Ghi nhận tiền. **Đi kèm:** `bank_reconcile_alert_days`
- **Đội đề xuất:** 24 – BR-527 (SEC BE-22).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – FOC (miễn phí) và hoa hồng

<a id="k-commission-pay-by-day"></a>
#### `commission_pay_by_day` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-212
- **Ý nghĩa:** Hạn chi hoa hồng trong tháng sau.
- **Đơn vị:** Không ghi ở tài liệu
- **Giới hạn, mặc định, ví dụ:** không ghi ở tài liệu này (hoa hồng hoặc thông tin tài khoản).
- **Ảnh hưởng:** Báo cáo hoa hồng. **Đi kèm:** `commission_payable_day`
- **Đội đề xuất:** Theo quyết định của chủ đầu tư. – BR-212.
- **Lưu ý khi sửa:** Đơn đã tạo giữ tỷ lệ lúc tạo (BR-006). Chỉ chủ đầu tư. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-commission-payable-day"></a>
#### `commission_payable_day` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-212
- **Ý nghĩa:** Ngày trong tháng chốt hoa hồng của tháng trước.
- **Đơn vị:** Không ghi ở tài liệu
- **Giới hạn, mặc định, ví dụ:** không ghi ở tài liệu này (hoa hồng hoặc thông tin tài khoản).
- **Ảnh hưởng:** Báo cáo hoa hồng. **Đi kèm:** `commission_pay_by_day`, `short_stay_commission_pct`
- **Đội đề xuất:** Theo quyết định của chủ đầu tư. – BR-212.
- **Lưu ý khi sửa:** Đơn đã tạo giữ tỷ lệ lúc tạo (BR-006). Chỉ chủ đầu tư. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-stay-waiver-review-hours"></a>
#### `stay_waiver_review_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-433
- **Ý nghĩa:** Tổng miễn giảm trên một lượt ở vượt ngưỡng: chủ đầu tư có bao nhiêu giờ để xem lại.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 168 · **Mặc định:** 24
- **Ví dụ:** 24: báo lúc 10:00 → hạn xem 10:00 hôm sau.
- **Ảnh hưởng:** Cần chú ý (chỉ báo, không chặn). **Đi kèm:** `foc_limits`
- **Đội đề xuất:** 24 – INV quyết ESC-026 A.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Kênh OTA và trùng phòng

<a id="k-channel-sync-outage-alert-minutes"></a>
#### `channel_sync_outage_alert_minutes` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-317
- **Ý nghĩa:** Đồng bộ kênh OTA mất bao nhiêu phút thì báo.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 5 đến 240 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 15.
- **Ảnh hưởng:** Cảnh báo kênh. **Đi kèm:** `manual_close_when_rooms_left_le`
- **Đội đề xuất:** 15 – BR-317.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Chưa có channel manager; bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-conflict-resolve-deadline-far"></a>
#### `conflict_resolve_deadline_far`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-317
- **Ý nghĩa:** Trùng phòng không gấp phải xử lý trước giờ này hôm sau.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12:00: phát hiện hôm nay → xử lý trước 12:00 mai.
- **Ảnh hưởng:** Cần chú ý. **Đi kèm:** `conflict_urgent_window_hours`
- **Đội đề xuất:** 12:00 – BR-317.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-conflict-resolve-minutes-urgent"></a>
#### `conflict_resolve_minutes_urgent`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-317
- **Ý nghĩa:** Trùng phòng gấp phải xử lý trong bao nhiêu phút.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 5 đến 240 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 60: phát hiện 14:00 → xử lý xong trước 15:00.
- **Ảnh hưởng:** Cần chú ý. **Đi kèm:** `conflict_urgent_window_hours`
- **Đội đề xuất:** 60 – BR-317.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-conflict-urgent-window-hours"></a>
#### `conflict_urgent_window_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-317
- **Ý nghĩa:** Trùng phòng (overbooking) có ngày đến trong bao nhiêu giờ tới thì tính là gấp.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 72 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 24: hai đơn trùng căn, khách đến chiều mai → gấp.
- **Ảnh hưởng:** Cần chú ý, xử lý trùng phòng. **Đi kèm:** `conflict_resolve_minutes_urgent`, `conflict_resolve_deadline_far`
- **Đội đề xuất:** 24 – BR-317 (chuẩn ngành).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-manual-close-when-rooms-left-le"></a>
#### `manual_close_when_rooms_left_le` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-317
- **Ý nghĩa:** Còn bằng hoặc ít hơn bao nhiêu căn trống thì đóng bán tay trên OTA.
- **Đơn vị:** Số căn
- **Giới hạn:** Từ 0 đến 10 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 1: nhóm Studio còn 1 căn trống → đóng trên OTA để tránh trùng.
- **Ảnh hưởng:** Việc tay của lễ tân trên OTA. **Đi kèm:** `channel_sync_outage_alert_minutes`
- **Đội đề xuất:** 1 – BR-317, BR-962.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Khai báo lưu trú và dữ liệu khách

<a id="k-attachment-ops-retention-months"></a>
#### `attachment_ops_retention_months`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC-I5
- **Ý nghĩa:** Ảnh, tệp vận hành (bảo trì, hư hỏng) giữ bao nhiêu tháng.
- **Đơn vị:** Tháng
- **Giới hạn:** Từ 3 đến 24 · **Mặc định:** 12
- **Ví dụ:** 12: ảnh tháng 11/2026 → xóa tháng 11/2027.
- **Ảnh hưởng:** Lưu trữ tệp. **Đi kèm:** `attachment_unbound_days`
- **Đội đề xuất:** 12 – SEC-I5.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-attachment-unbound-days"></a>
#### `attachment_unbound_days`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC-I5
- **Ý nghĩa:** Tệp đã tải lên mà chưa gắn vào hồ sơ nào bị xóa sau bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 7 · **Mặc định:** 7
- **Ví dụ:** 7: tải ảnh rồi đóng cửa sổ không lưu → 7 ngày sau ảnh mất.
- **Ảnh hưởng:** Lưu trữ tệp. **Đi kèm:** `attachment_ops_retention_months`
- **Đội đề xuất:** 7 – SEC-I5.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-deposit-receipt-retention-days"></a>
#### `deposit_receipt_retention_days`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SEC-I5
- **Ý nghĩa:** Ảnh biên nhận chuyển khoản cọc giữ bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 30 đến 365 · **Mặc định:** 90
- **Ví dụ:** 90: ảnh tải lên 06/11 → xóa 04/02.
- **Ảnh hưởng:** Lưu trữ tệp. **Đi kèm:** `attachment_ops_retention_months`
- **Đội đề xuất:** 90 – SEC-I5.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-document-profile-retention-months"></a>
#### `document_profile_retention_months` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** T05
- **Ý nghĩa:** Hồ sơ khách tạo từ giấy tờ giữ bao nhiêu tháng sau lần ở cuối.
- **Đơn vị:** Tháng
- **Giới hạn:** Từ 1 đến 12 (biên cứng của đội bảo mật) · **Mặc định:** 12
- **Ví dụ:** 3: ở lần cuối tháng 11/2026 → xóa sau tháng 2/2027.
- **Ảnh hưởng:** Hồ sơ khách, mã khách quay lại. **Đi kèm:** `id_image_retention_days_after_checkout`
- **Đội đề xuất:** 3 – INV 26/10 (BR-610).
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-id-image-purge-max-hours"></a>
#### `id_image_purge_max_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-609
- **Ý nghĩa:** Hạn trên để máy dọn ảnh giấy tờ đến hạn xóa.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 24 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 24: ảnh đến hạn xóa thì chậm nhất 24 giờ sau phải mất.
- **Ảnh hưởng:** Lưu trữ ảnh. **Đi kèm:** `id_image_unconfirmed_max_days`
- **Đội đề xuất:** 24 – BR-609 [PL + SEC].
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-id-image-retention-days-after-checkout"></a>
#### `id_image_retention_days_after_checkout`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-610
- **Ý nghĩa:** Ảnh giấy tờ đã khai báo xong được giữ bao nhiêu ngày sau trả phòng.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30: trả phòng 06/11 → ảnh xóa 06/12.
- **Ảnh hưởng:** Lưu trữ ảnh giấy tờ. **Đi kèm:** `id_image_unconfirmed_max_days`, `id_image_purge_max_hours`
- **Đội đề xuất:** 30 (mức tối đa hiện có); 90 khi đội nới giới hạn. – INV 26/10 muốn "3 tháng"; biên hiện tại tối đa 30 (BR-610).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-id-image-unconfirmed-max-days"></a>
#### `id_image_unconfirmed_max_days`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SR-RET-02
- **Ý nghĩa:** Ảnh giấy tờ chưa khai báo xong giữ tối đa bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 7 · **Mặc định:** 7
- **Ví dụ:** 7: chụp 06/11 mà chưa xác nhận khai báo → xóa 13/11.
- **Ảnh hưởng:** Lưu trữ ảnh giấy tờ. **Đi kèm:** `id_image_retention_days_after_checkout`
- **Đội đề xuất:** 7 – BR-609 (DOM + SEC).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-minor-data-age-threshold"></a>
#### `minor_data_age_threshold`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-612
- **Ý nghĩa:** Dưới tuổi này là trẻ em theo luật bảo vệ dữ liệu – xử lý dữ liệu riêng.
- **Đơn vị:** Tuổi
- **Giới hạn:** Từ 14 đến 18 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 16: khách 15 tuổi → cần người giám hộ đồng ý.
- **Ảnh hưởng:** Khai báo, hồ sơ khách. **Đi kèm:** –
- **Đội đề xuất:** 16 – BR-612 – Luật Trẻ em 2016 theo DOM hiểu, cần luật sư rà [PL].
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Đổi chỉ theo ý kiến luật sư. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-portal-date-format"></a>
#### `portal_date_format`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-606
- **Ý nghĩa:** Định dạng ngày khi sao chép dữ liệu sang cổng khai báo.
- **Đơn vị:** Chữ: dd/MM/yyyy hoặc yyyy-MM-dd
- **Giới hạn:** Chỉ nhận: dd/MM/yyyy, yyyy-MM-dd · **Mặc định:** dd/MM/yyyy
- **Ví dụ:** "dd/MM/yyyy": 06/11/2026.
- **Ảnh hưởng:** Nút sao chép khai báo. **Đi kèm:** `portal_nationality_format`
- **Đội đề xuất:** dd/MM/yyyy – INV-018 (BR-606).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-portal-nationality-format"></a>
#### `portal_nationality_format`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-606
- **Ý nghĩa:** Định dạng quốc tịch khi sao chép sang cổng khai báo.
- **Đơn vị:** Chữ: alpha3 hoặc name_vi_alpha3
- **Giới hạn:** Chỉ nhận: name_vi_alpha3, alpha3 · **Mặc định:** alpha3
- **Ví dụ:** "alpha3": KOR. "name_vi_alpha3": Hàn Quốc (KOR).
- **Ảnh hưởng:** Nút sao chép khai báo. **Đi kèm:** `portal_date_format`
- **Đội đề xuất:** alpha3 – INV-018.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-privacy-notice-version"></a>
#### `privacy_notice_version`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** R-CON-02
- **Ý nghĩa:** Bản thông báo quyền riêng tư đang dùng (tờ "Your ID details" và trang khách).
- **Đơn vị:** Chữ (tên bản)
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** privacy-2026-10-v1
- **Ví dụ:** "privacy-2026-10-v2".
- **Ảnh hưởng:** Trang khách, khai báo, form web. **Đi kèm:** `public_booking_requests_enabled`
- **Đội đề xuất:** privacy-2026-10-v2 – Từ v1.0.4 chỉ nhận đúng bản có chữ trên hệ thống.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Chỉ đổi đúng ngày thay tờ in mới, gọi người trực xác nhận trước khi Lưu. Đã Lưu thì trong ngày không quay lại được. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-registration-deadline-foreigner-hours"></a>
#### `registration_deadline_foreigner_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-603
- **Ý nghĩa:** Khách nước ngoài phải khai báo trong bao nhiêu giờ sau khi đến.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 24 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 12: đến 14:00 → khai trước 02:00 hôm sau.
- **Ảnh hưởng:** Cần chú ý, việc khai báo. **Đi kèm:** `registration_deadline_foreigner_mode`
- **Đội đề xuất:** 12 – BR-603 [PL].
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Đổi chỉ theo ý kiến luật sư. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-registration-deadline-foreigner-mode"></a>
#### `registration_deadline_foreigner_mode`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-603
- **Ý nghĩa:** Cách tính hạn khai khách nước ngoài.
- **Đơn vị:** Chữ: hours_only / earlier_of
- **Giới hạn:** Không có giới hạn số. Desk chỉ kiểm là chữ (tối đa 500 ký tự), chưa kiểm có đúng một giá trị trong danh sách: gõ sai chữ Desk vẫn lưu. Chép đúng chữ ở mục Ví dụ. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "hours_only": chỉ tính theo số giờ ở trên.
- **Ảnh hưởng:** Hạn khai báo. **Đi kèm:** `registration_deadline_foreigner_hours`
- **Đội đề xuất:** hours_only – BR-603; "earlier_of" chỉ bật nếu luật sư yêu cầu.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-registration-deadline-vn"></a>
#### `registration_deadline_vn`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-602
- **Ý nghĩa:** Hạn khai báo lưu trú khách Việt Nam.
- **Đơn vị:** {before, lateArrivalFrom, lateArrivalDeadlineNextDay}: giờ
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Khách đến 15:00 → khai trước 23:00 cùng ngày; khách đến 23:30 → khai trước 08:00 hôm sau.
- **Ảnh hưởng:** Cần chú ý, việc khai báo. **Đi kèm:** `registration_reminder_before_minutes`
- **Đội đề xuất:** Như ví dụ. – BR-602 – cần luật sư rà (ESC-001) [PL].
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Đổi chỉ theo ý kiến luật sư. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-registration-digest-times"></a>
#### `registration_digest_times`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-611
- **Ý nghĩa:** Giờ gửi bản tổng hợp việc khai báo còn thiếu.
- **Đơn vị:** Danh sách giờ
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** ["22:00","07:00"].
- **Ảnh hưởng:** Thông báo người trực. **Đi kèm:** –
- **Đội đề xuất:** ["22:00","07:00"] – INV-010 (BR-611).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-registration-reminder-before-minutes"></a>
#### `registration_reminder_before_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-603
- **Ý nghĩa:** Nhắc trước hạn khai báo bao nhiêu phút.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 0 đến 720 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 120: hạn 23:00 → nhắc 21:00.
- **Ảnh hưởng:** Thông báo. **Đi kèm:** `registration_deadline_vn`
- **Đội đề xuất:** 120 – BR-603 (chuẩn ngành).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-retention-guest-request-months"></a>
#### `retention.guest_request_months`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** T13
- **Ý nghĩa:** Yêu cầu khách gửi từ trang khách giữ bao nhiêu tháng.
- **Đơn vị:** Tháng
- **Giới hạn:** Từ 1 đến 12 · **Mặc định:** 12
- **Ví dụ:** 12.
- **Ảnh hưởng:** Lưu trữ yêu cầu khách. **Đi kèm:** –
- **Đội đề xuất:** 12 – T13 (SEC).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-visa-expiry-warning-days-long-stay"></a>
#### `visa_expiry_warning_days.long_stay`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-605
- **Ý nghĩa:** Khách thuê tháng: báo trước khi thị thực hết bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 180 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30: visa hết 31/12 → báo từ 01/12.
- **Ảnh hưởng:** Cần chú ý. **Đi kèm:** `visa_expiry_warning_days.short_stay`
- **Đội đề xuất:** 30 – BR-605. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-visa-expiry-warning-days-short-stay"></a>
#### `visa_expiry_warning_days.short_stay`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-605
- **Ý nghĩa:** Khách ngắn ngày: báo khi thị thực còn ít hơn bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 90 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 14: visa hết 15/11, khách ở tới 20/11 → báo.
- **Ảnh hưởng:** Nhận phòng, Cần chú ý. **Đi kèm:** `visa_expiry_warning_days.long_stay`
- **Đội đề xuất:** 14 – BR-605. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Buồng phòng và bảo trì

<a id="k-daily-clean-status-time"></a>
#### `daily_clean_status_time`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-802
- **Ý nghĩa:** Giờ Desk chuyển căn có khách sang "cần dọn" hằng ngày.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 07:00.
- **Ảnh hưởng:** Sơ đồ phòng, app buồng phòng. **Đi kèm:** `linen_change_every_nights`
- **Đội đề xuất:** 07:00 – INV-008 (BR-802).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-doc-code-format-work-order"></a>
#### `doc_code_format.work_order`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-007
- **Ý nghĩa:** Cách đánh số phiếu bảo trì.
- **Đơn vị:** {prefix, padWidth, period, scope}
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** {"scope": "property", "period": "none", "prefix": "WO-", "padWidth": 5}
- **Ví dụ:** WO-00034.
- **Ảnh hưởng:** Phiếu bảo trì. **Đi kèm:** –
- **Đội đề xuất:** Giữ mặc định. – BR-007.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Số đã cấp không đổi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-expiry-warning-days"></a>
#### `expiry_warning_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-706
- **Ý nghĩa:** Báo đồ minibar sắp hết hạn trước bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 90 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 7.
- **Ảnh hưởng:** Minibar. **Đi kèm:** –
- **Đội đề xuất:** 7 – BR-706.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-extra-guest-kit-due"></a>
#### `extra_guest_kit_due` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-812
- **Ý nghĩa:** Bộ đồ người thêm phải sẵn trong căn trước mốc nào.
- **Đơn vị:** Chữ (lựa chọn)
- **Giới hạn:** Không có giới hạn số. Desk chỉ kiểm là chữ (tối đa 500 ký tự), chưa kiểm có đúng một giá trị trong danh sách: gõ sai chữ Desk vẫn lưu. Chép đúng chữ ở mục Ví dụ. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "booking_checkin_time": trước giờ nhận phòng của đơn.
- **Ảnh hưởng:** Việc buồng phòng. **Đi kèm:** `extra_guest_kit_items`, `extra_guest_kit_midstay_due_minutes`
- **Đội đề xuất:** booking_checkin_time – BR-812.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-extra-guest-kit-items"></a>
#### `extra_guest_kit_items` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-812
- **Ý nghĩa:** Bộ đồ cho mỗi người vượt định mức.
- **Đơn vị:** Danh sách món
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Mỗi người thêm: 1 mền, 1 khăn tắm, 1 khăn mặt, 1 bàn chải, 1 bộ vệ sinh cá nhân.
- **Ảnh hưởng:** Việc buồng phòng. **Đi kèm:** `extra_guest_kit_due`
- **Đội đề xuất:** Như ví dụ. – INV quyết ESC-014.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-extra-guest-kit-midstay-due-minutes"></a>
#### `extra_guest_kit_midstay_due_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-812
- **Ý nghĩa:** Thêm người giữa kỳ ở thì bộ đồ phải tới căn trong bao nhiêu phút.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 15 đến 480 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 60: 15:00 báo thêm 1 người → buồng phòng mang đồ trước 16:00.
- **Ảnh hưởng:** Việc buồng phòng. **Đi kèm:** `extra_guest_kit_items`
- **Đội đề xuất:** 60 – BR-812. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-hk-self-inspection-enabled"></a>
#### `hk_self_inspection_enabled`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-802
- **Ý nghĩa:** Cho buồng phòng tự kiểm căn sau khi dọn (không cần người kiểm).
- **Đơn vị:** Bật / tắt
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Tắt: dọn xong chuyển "chờ kiểm".
- **Ảnh hưởng:** App buồng phòng, sơ đồ phòng. **Đi kèm:** –
- **Đội đề xuất:** Tắt (false) – BR-802. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-linen-change-every-nights"></a>
#### `linen_change_every_nights`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-807
- **Ý nghĩa:** Thay ga gối sau mỗi bao nhiêu đêm.
- **Đơn vị:** Số đêm
- **Giới hạn:** Từ 1 đến 14 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 3: khách ở 7 đêm → thay đêm 3 và đêm 6.
- **Ảnh hưởng:** Việc buồng phòng. **Đi kèm:** `daily_clean_status_time`
- **Đội đề xuất:** 3 – INV-008 (BR-807).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-long-stay-cleaning-window"></a>
#### `long_stay_cleaning_window` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-807
- **Ý nghĩa:** Khung giờ dọn căn thuê tháng.
- **Đơn vị:** Khoảng giờ [từ, đến)
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** ["09:00","11:00"].
- **Ảnh hưởng:** Lịch buồng phòng. **Đi kèm:** –
- **Đội đề xuất:** ["09:00","11:00"] – BR-807 (chuẩn ngành).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-lost-found-keep-days"></a>
#### `lost_found_keep_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-513
- **Ý nghĩa:** Đồ thất lạc giữ bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 365 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 30.
- **Ảnh hưởng:** Sổ đồ thất lạc. **Đi kèm:** `lost_found_notify_hours`
- **Đội đề xuất:** 30 – BR-513. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-lost-found-notify-hours"></a>
#### `lost_found_notify_hours` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-513
- **Ý nghĩa:** Báo khách về đồ thất lạc trong bao nhiêu giờ.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 168 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 24.
- **Ảnh hưởng:** Sổ đồ thất lạc. **Đi kèm:** `lost_found_keep_days`
- **Đội đề xuất:** 24 – BR-513. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-maintenance-due-warning-days"></a>
#### `maintenance_due_warning_days` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-810
- **Ý nghĩa:** Báo trước lịch bảo trì định kỳ bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 60 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 7.
- **Ảnh hưởng:** Cần chú ý. **Đi kèm:** –
- **Đội đề xuất:** 7 – BR-810.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-ooo-reopen-buffer-days"></a>
#### `ooo_reopen_buffer_days`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-804
- **Ý nghĩa:** Căn khóa sửa chữa: mở bán lại sau ngày dự kiến xong bao nhiêu ngày.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 0 đến 7 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 1: dự kiến sửa xong 10/11 → mở bán từ 11/11.
- **Ảnh hưởng:** Khóa phòng, bán phòng. **Đi kèm:** –
- **Đội đề xuất:** 1 – BR-804.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-room-status-reconcile-time"></a>
#### `room_status_reconcile_time` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-806
- **Ý nghĩa:** Giờ đối chiếu trạng thái buồng hằng ngày.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 07:00.
- **Ảnh hưởng:** Việc buồng phòng. **Đi kèm:** –
- **Đội đề xuất:** 07:00 – BR-806.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-stocktake-variance-approval-pct"></a>
#### `stocktake_variance_approval_pct` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-705
- **Ý nghĩa:** Kiểm kho lệch quá bao nhiêu % thì cần quản lý duyệt.
- **Đơn vị:** %
- **Giới hạn:** Từ 0 đến 100 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 5 %.
- **Ảnh hưởng:** Kiểm kho. **Đi kèm:** –
- **Đội đề xuất:** 5 – BR-705. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-vacant-reinspect-days"></a>
#### `vacant_reinspect_days`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-805
- **Ý nghĩa:** Căn trống sạch bao nhiêu ngày thì phải kiểm lại.
- **Đơn vị:** Ngày
- **Giới hạn:** Từ 1 đến 30 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 3: căn sạch từ 06/11, chưa có khách → kiểm lại 09/11.
- **Ảnh hưởng:** Việc buồng phòng. **Đi kèm:** –
- **Đội đề xuất:** 3 – BR-805.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-wo-done-photo-required-severities"></a>
#### `wo_done_photo_required_severities`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-809
- **Ý nghĩa:** Mức độ phiếu nào bắt buộc có ảnh khi báo xong.
- **Đơn vị:** Danh sách mức
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** ["high", "medium"]
- **Ví dụ:** ["high","medium"]: phiếu cao và trung bình phải có ảnh.
- **Ảnh hưởng:** Phiếu bảo trì. **Đi kèm:** `wo_sla`
- **Đội đề xuất:** ["high","medium"] – BR-809.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-wo-sla"></a>
#### `wo_sla`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-809
- **Ý nghĩa:** Hạn xử lý phiếu bảo trì theo mức độ.
- **Đơn vị:** {high, medium, low}: phút/giờ
- **Giới hạn:** Không có giới hạn số. Desk **chưa** kiểm dạng khi lưu, kể cả v1.0.5: gõ sai dạng Desk vẫn lưu, lỗi chỉ hiện lúc dùng. Sửa thì chọn **Hiệu lực từ** là ngày mai và nhắn đội kiểm trong ngày (Quy tắc chung bước 10). · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** Cao: nhận trong 15 phút, có phương án trong 2 giờ; trung bình: xong trong 24 giờ; thấp: 72 giờ.
- **Ảnh hưởng:** Phiếu bảo trì, Cần chú ý. **Đi kèm:** `wo_done_photo_required_severities`
- **Đội đề xuất:** Như ví dụ. – BR-809. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Mất mạng, mất điện

<a id="k-contingency-sheet-time"></a>
#### `contingency_sheet_time` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-961
- **Ý nghĩa:** Giờ in bảng dự phòng (danh sách khách, căn) mỗi sáng.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 06:30.
- **Ảnh hưởng:** Việc lễ tân. **Đi kèm:** –
- **Đội đề xuất:** 06:30 – BR-961.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-offline-backfill-max-hours"></a>
#### `offline_backfill_max_hours` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-963
- **Ý nghĩa:** Mất mạng: được nhập bù vào Desk tối đa bao nhiêu giờ sau.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 72 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 24.
- **Ảnh hưởng:** Nhập bù. **Đi kèm:** –
- **Đội đề xuất:** 24 – BR-963.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-power-outage-escalate-hours"></a>
#### `power_outage_escalate_hours` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-964
- **Ý nghĩa:** Mất điện quá bao nhiêu giờ thì báo chủ đầu tư.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 1 đến 48 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 4.
- **Ảnh hưởng:** Báo sự cố. **Đi kèm:** –
- **Đội đề xuất:** 4 – BR-964. [GIẢ ĐỊNH]
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Khóa cửa

<a id="k-birthday-code-random-digits"></a>
#### `birthday_code_random_digits` [Đã bỏ]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-403
- **Ý nghĩa:** Cách cũ: số chữ số ngẫu nhiên ghép sau ngày sinh làm mã cửa. Đã bỏ.
- **Đơn vị:** Chữ số
- **Giới hạn:** Từ 3 đến 6 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** —
- **Ảnh hưởng:** Không còn dùng. **Đi kèm:** `door_code_min_digits`
- **Đội đề xuất:** Không dùng. – Đã bỏ từ BR v0.3.9.
- **Lưu ý khi sửa:** Tham số đã bỏ, không còn tác dụng. Không sửa. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-door-code-min-digits"></a>
#### `door_code_min_digits` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-403
- **Ý nghĩa:** Số chữ số của mã cửa.
- **Đơn vị:** Chữ số
- **Giới hạn:** Từ 6 đến 9 · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 8: mã cửa có 8 chữ số.
- **Ảnh hưởng:** Mã cửa gửi khách. **Đi kèm:** `door_lock_vendor`
- **Đội đề xuất:** 8 – INV 19/10 + SEC (BR-403).
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-door-lock-vendor"></a>
#### `door_lock_vendor` [Chưa dùng]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-403
- **Ý nghĩa:** Hãng khóa cửa.
- **Đơn vị:** Chữ
- **Giới hạn:** Không có giới hạn số. Desk chỉ kiểm là chữ (tối đa 500 ký tự), chưa kiểm có đúng một giá trị trong danh sách: gõ sai chữ Desk vẫn lưu. Chép đúng chữ ở mục Ví dụ. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "TTLock".
- **Ảnh hưởng:** Tạo mã cửa (khi có kết nối). **Đi kèm:** `door_code_min_digits`
- **Đội đề xuất:** TTLock – INV-TT.
- **Lưu ý khi sửa:** Bản Desk hiện tại chưa đọc tham số này: sửa chưa đổi gì trên Desk. Giữ đúng giá trị để bản sau dùng. Bản Desk hiện tại chưa đọc tham số này. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Bảo mật

<a id="k-login-lockout"></a>
#### `login_lockout` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SR-AUTH-04
- **Ý nghĩa:** Khóa tài khoản nhân viên khi nhập sai mật khẩu nhiều lần.
- **Đơn vị:** {maxFailures, lockMinutes, lockWindowHours, hardLockAfterLocks}
- **Giới hạn:** Biên cứng của đội bảo mật: lockMinutes 15–60; maxFailures 3–5; lockWindowHours 24–72; hardLockAfterLocks 2–3 · **Mặc định:** {"lockMinutes": 15, "maxFailures": 5, "lockWindowHours": 24, "hardLockAfterLocks": 3}
- **Ví dụ:** Sai 5 lần → khóa 15 phút; bị khóa 3 lần trong 24 giờ → khóa hẳn, chủ đầu tư mở.
- **Ảnh hưởng:** Đăng nhập Desk và app nhân viên. **Đi kèm:** `session_policy`
- **Đội đề xuất:** Giữ mặc định. – SR-AUTH-04.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-session-policy"></a>
#### `session_policy` [Bảo mật]

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** SR-SES-03
- **Ý nghĩa:** Phiên đăng nhập kéo dài bao lâu.
- **Đơn vị:** {admin: idleMinutes, maxHours; staff_pwa: idleMinutes, maxHours}
- **Giới hạn:** Biên cứng của đội bảo mật: admin.maxHours 1–12; admin.idleMinutes 5–30; staff_pwa.maxHours 24–720; staff_pwa.idleMinutes 60–4.320 · **Mặc định:** {"admin": {"maxHours": 12, "idleMinutes": 30}, "staff_pwa": {"maxHours": 720, "idleMinutes": 4320}}
- **Ví dụ:** Desk: không dùng 30 phút thì thoát, tối đa 12 giờ. App nhân viên: tối đa 720 giờ (30 ngày).
- **Ảnh hưởng:** Đăng nhập. **Đi kèm:** `login_lockout`
- **Đội đề xuất:** Giữ mặc định. – SR-SES-03.
- **Lưu ý khi sửa:** Bảo mật – chỉ sửa khi đội khuyên. Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

### Khác – Hệ thống

<a id="k-business-day-rollover"></a>
#### `business_day_rollover`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-010
- **Ý nghĩa:** Giờ Desk sang ngày làm việc mới.
- **Đơn vị:** Giờ hh:mm
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** 06:00: 02:00 sáng 07/11 vẫn tính là ngày 06/11.
- **Ảnh hưởng:** Ngày làm việc, báo cáo, ô Hiệu lực từ. **Đi kèm:** `timezone`
- **Đội đề xuất:** 06:00 – BR-010 (chuẩn ngành).
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Không sửa khi chưa hỏi đội: ảnh hưởng mọi báo cáo và hạn. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-idempotency-ttl-hours"></a>
#### `idempotency_ttl_hours`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** ADR-009
- **Ý nghĩa:** Desk nhớ một lần bấm (chống bấm hai lần ghi hai lần) trong bao nhiêu giờ.
- **Đơn vị:** Giờ
- **Giới hạn:** Từ 24 đến 720 · **Mặc định:** 48
- **Ví dụ:** 48.
- **Ảnh hưởng:** Kỹ thuật. **Đi kèm:** –
- **Đội đề xuất:** 48 – ADR-009.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Không cần sửa. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-job-catchup-minutes"></a>
#### `job_catchup_minutes`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** architecture 9.1
- **Ý nghĩa:** Máy chủ khởi động lại: việc nhắc trễ quá bao nhiêu phút thì bỏ, không gửi bù.
- **Đơn vị:** Phút
- **Giới hạn:** Từ 1 đến 1.440 · **Mặc định:** 60
- **Ví dụ:** 60.
- **Ảnh hưởng:** Nhắc tự động. **Đi kèm:** –
- **Đội đề xuất:** 60 – Kiến trúc 9.1.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Không cần sửa. Ai sửa: Chủ đầu tư, Quản lý. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="k-timezone"></a>
#### `timezone`

- **Tên trên Desk:** (chưa có tên tiếng Việt – Desk hiện mã khóa) · **Nhóm:** Khác · **Quy tắc:** BR-001
- **Ý nghĩa:** Múi giờ của cơ sở.
- **Đơn vị:** Tên múi giờ
- **Giới hạn:** Không có giới hạn số. Desk kiểm đúng dạng khi lưu. · **Mặc định:** Không có trong danh mục (đội nạp giá trị đầu theo BR mục 13 lúc khởi tạo).
- **Ví dụ:** "Asia/Ho_Chi_Minh".
- **Ảnh hưởng:** Mọi giờ trên Desk. **Đi kèm:** `business_day_rollover`
- **Đội đề xuất:** Asia/Ho_Chi_Minh – BR-001.
- **Lưu ý khi sửa:** Áp từ ngày hiệu lực cho việc phát sinh từ ngày đó; không đổi số tiền đã ghi. Chỉ chủ đầu tư. Không sửa. Ai sửa: Chủ đầu tư. Không cần nhập lại mật khẩu. Hiệu lực từ: để ngày Desk điền sẵn (hôm nay) hoặc chọn ngày sau. Đã lưu thì trong ngày không sửa lại được; lỡ sai thì lưu lại với Hiệu lực từ = ngày mai.

<a id="lech-so-tay"></a>

## Tham số trên production lệch sổ tay

Đối chiếu danh mục production ngày 06/11/2026 với mức đội đề xuất ở trên. Mục này chỉ nêu tên và hướng lệch, không ghi số đang chạy; xem số trên Desk. Đã báo đủ số cho Điều phối viên.

**A. Đã nằm trong hướng dẫn chuyển giá 01/11 (phần B), chưa làm xong:**

| Mã khóa | Hướng lệch | Việc cần làm |
|---|---|---|
| `special_uplift_pct` | Còn tăng giá ngày đặc biệt (cao hơn đề xuất 0). | Hướng dẫn chuyển giá B2. |
| `los_discount` | Còn giảm theo số đêm (đề xuất không giảm). | B3. |
| `long_stay_required_from_nights` | Ngưỡng thuê tháng thấp hơn 30. | B4. |
| `short_stay_max_nights` | Ngắn ngày tối đa thấp hơn 29. | B5, làm ngay sau B4. |
| `early_checkin_tiers` | Bậc phụ thu nhận sớm còn kéo quá 11:00 (đề xuất miễn phí từ 11:00). | B7. |
| `child_fee_6_11` | Thấp hơn đề xuất 150.000, dù có dòng mới lưu ngày 06/11. | B8 – xem dòng 06/11 ở Lịch sử thay đổi; lưu 150.000 với Hiệu lực từ = ngày mai. |
| `long_stay_compare_from_nights` | Khối "So sánh: thuê 1 tháng" hiện từ ít đêm hơn 30. | B9. |
| `rounding.monthly_rent` | Làm tròn thô hơn 1.000. | B11. |

Trong khi phần B chưa xong, Desk và web ra số lai (ví dụ đơn 7 đêm vẫn giảm, đơn 28–29 đêm bị chặn). Giá căn City View (Amber, Mist) ở Danh mục căn cũng phải là 800.000 theo INV 06/11 (ESC-050) – không thuộc tham số.

**B. Lệch ngoài hướng dẫn chuyển giá** (`rounding.ota_rate` là lệch mới, chưa ai báo; hai dòng sau đã ghi ở BR mục 13, chờ H7):

| Mã khóa | Hướng lệch | Đề xuất |
|---|---|---|
| `rounding.ota_rate` | Làm tròn giá đơn OTA thô hơn 1.000. | Đổi về 1.000 cùng lần chuyển giá. Với giá hiện tại không ra số khác, chỉ khác khi sau này có mức tăng hoặc giảm. |
| `lease_terms` | Bảng kỳ hạn còn mức giảm và hệ số ký quỹ theo bảng cũ (trước 01/11). | Không sửa tay. Desk chỉ đọc mức giảm của kỳ 1 tháng (khớp đề xuất); hệ số ký quỹ chưa dùng. Đội đổi cấu trúc ở H7; tới lúc đó sale dùng bảng tra thuê tháng. |
| `early_termination` | Còn bậc theo số ngày báo trước (đề xuất mất toàn bộ ký quỹ, ESC-045 câu 4). | Desk chưa đọc. Đội cập nhật cùng H7 để dữ liệu không mâu thuẫn quyết định. |

Các tham số còn lại khớp mức đề xuất, hoặc chưa có giá trị riêng và đang dùng mặc định đúng. Riêng `id_image_retention_days_after_checkout`: 90 ngày theo ý anh/chị cần đội nới giới hạn ở bản sau.

<a id="sap-co-v105"></a>

## Sắp có ở v1.0.5 (chưa có trên Desk)

Các khóa dưới đây **chưa có** trên Desk v1.0.4. Tên khóa là tên đội đề xuất; ARC chốt tên thật ở hợp đồng 0.3.13. Khi v1.0.5 lên production, đội cập nhật mục này theo tên thật và chuyển từng khóa vào nhóm của nó. **Mã không có số mặc định** cho các khóa này: anh/chị tự nhập trên Desk sau khi bản lên (đội không đổi tham số giá trên production). Luật chi tiết và ca kiểm: `rounds/round-05/outputs/DOM/rules-v1.0.5.md`.

### Sửa ở v1.0.5: Desk kiểm đúng dạng `min_stay` và `weekend_nights` khi lưu (V5-25)

> **Tới khi v1.0.5 lên:** không bấm **Lưu thay đổi** ở `weekend_nights` (**Đêm tính là cuối tuần**) và `min_stay` (**Ở tối thiểu**). Buộc phải đổi thì nhắn đội trước, chọn **Hiệu lực từ** là ngày mai để còn **Hủy lịch**. Lỡ lưu thì báo đội ngay, coi là P0. Lưu sai `min_stay` thì mọi báo giá và đơn trực tiếp mới báo lỗi tới 06:00 hôm sau (mốc đổi ngày làm việc), khi đội đã lưu lại giá trị đúng cho ngày mai; không gỡ được trong ngày (BUG-R5-003). Lưu sai `weekend_nights` thì Desk không nhận ra đêm cuối tuần (BUG-R5-001).

Hai khóa đã có trên Desk; v1.0.5 chỉ đổi cách Desk kiểm khi lưu. Giá trị đang chạy không đổi và vẫn hợp lệ.

- **`weekend_nights`:** Desk nhận dạng mã thứ ["FRI","SAT"] (dạng đang chạy) và từ chối số 1–7.
- **`min_stay`** – Desk chỉ nhận danh sách luật. Mỗi luật:
  - `nights`: số nguyên từ 1 đến 7, và không quá **Đơn ngắn ngày dài nhất** (`short_stay_max_nights`, đề xuất 29). 1 đêm = những ngày đó không có tối thiểu. Muốn trên 7 đêm: hỏi đội;
  - `channels`: "all" (mọi kênh), hoặc danh sách trong "direct" (Trực tiếp), "agent" (CTV/môi giới), "ota". Không ghi "internal": kênh Nội bộ không áp ở tối thiểu (BR-113). Ở tối thiểu trên Booking, Agoda, Airbnb vẫn cài bằng tay trên trang của kênh;
  - `arrivalWeekdays`: danh sách mã thứ, mỗi thứ một lần, và/hoặc `"arrivalOnSpecialDates": true` (ngày trong `special_dates`). Mỗi luật phải áp vào ít nhất một ngày;
  - không thêm khóa nào khác. Gõ sai tên khóa (ví dụ thiếu chữ "s") thì Desk từ chối, không lưu luật rỗng;
  - tối đa 20 luật. Hai luật cùng ngày đến: Desk áp số đêm lớn hơn.
- **`[]` (danh sách rỗng):** Desk cho lưu, nghĩa là **không có ở tối thiểu** ngày nào. Dùng khi muốn tắt hẳn, ví dụ mùa thấp điểm. Bật lại: dán lại giá trị đề xuất.
- **Ví dụ đúng (giá trị đang chạy, mức anh/chị đã chọn ở ESC-004):** `[{"nights":2,"channels":"all","arrivalWeekdays":["FRI","SAT"]},{"nights":2,"channels":"all","arrivalOnSpecialDates":true}]`
- **Ví dụ bị từ chối từ v1.0.5:** `2`; `{"nights":2}`; `nights` = 0 hoặc 8; `"arrivalWeekdays":["FRI","FRI"]`; `"arrivalWeekdays":[5,6]`; luật thiếu `channels`; `"channels":["internal"]`.
- Đổi `short_stay_max_nights` xuống thấp hơn số đêm lớn nhất trong `min_stay`: Desk từ chối.
- Nếu giá trị hỏng đã có sẵn trong dữ liệu, từ v1.0.5 Desk bỏ qua luật hỏng và vẫn báo giá, tạo đơn được; đội nhận cảnh báo để sửa.
- Luật chi tiết và ca kiểm: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 8.4 (`weekend_nights`) và mục 12 (`min_stay`).

### Sửa ở v1.0.5: Desk kiểm dạng khi lưu thêm 12 khóa có cấu trúc (V5-25, PR #96 và PR `damage_catalog`)

- Các khóa: `special_dates`, `los_discount`, `cancel_policy_direct`, `early_checkin_tiers`, `late_checkout_tiers`, `early_departure_refund`, `checkout_reminders`, `max_open_holds_per_user`, `lease_terms`, `weekend_uplift_channels`, `special_uplift_channels`, `damage_catalog`. Dạng nhận ghi ở dòng **Giới hạn** của từng khóa.
- v1.0.4 chưa kiểm các khóa này khi lưu. Tới khi v1.0.5 lên, sửa ô danh sách theo Quy tắc chung bước 10 (Hiệu lực từ ngày mai, nhắn đội kiểm trong ngày, sai thì Hủy lịch).
- Giá trị đang chạy đều hợp lệ theo dạng mới. Trước khi lên v1.0.5, đội chạy một câu kiểm chỉ đọc trên production; dòng nào sai dạng thì anh/chị sửa trên Desk trước.
- Giá trị hỏng đã có sẵn trong dữ liệu: Desk bỏ qua phần hỏng ở báo giá, Hôm nay và bảng đền bù; Desk chặn kèm lời báo rõ ở thao tác tính tiền hoàn hay phụ thu (hủy, trả sớm, nhận sớm, trả muộn) và ở giới hạn giữ chỗ của sale, CTV. Quản lý sửa tham số rồi làm lại.
- Mười khóa danh sách khác (ví dụ `wo_sla`, `room_move_pricing`, `utility_estimate`) vẫn **chưa** được kiểm ở v1.0.5: dòng **Giới hạn** của từng khóa ghi rõ.
- Luật chi tiết: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 13.

### Phí dọn theo lượt cho khách thuê tháng (H3, V5-31)

#### `long_stay_cleaning_fee_by_room` [Giá] (tên đề xuất)

- **Tên trên Desk (đề xuất):** Phí dọn theo lượt – khách thuê tháng · **Quy tắc:** BR-204, BR-506
- **Ý nghĩa:** Giá một lượt dọn cho khách **thuê tháng** (đơn dài hạn), theo hạng của căn. Khách ngắn ngày vẫn dùng `adhoc_cleaning_fee`.
- **Đơn vị:** Danh sách theo số căn: {"số căn": VND mỗi lượt}
- **Giới hạn:** Mỗi số từ 0 đến 5.000.000, bội 1.000; số căn phải có trong Danh mục căn. · **Mặc định:** Không có.
- **Ví dụ:** Khách thuê tháng căn 203 gọi dọn 2 lần trong tháng → 2 × 120.000 = **240.000** (Desk v1.0.4 tính 2 × 100.000 = 200.000).
- **Ảnh hưởng:** Giá "Dọn thêm" trên trang khách của khách thuê tháng, dòng dọn phòng trên folio, mục **Thêm phát sinh**. **Đi kèm:** `adhoc_cleaning_fee`
- **Đội đề xuất:** Theo bảng giá 01/11 (Studio City 100.000 · Studio Garden 120.000 · Premium 130.000 · Signature 150.000), dán nguyên dòng: `{"101":100000,"201":100000,"102":120000,"103":120000,"202":120000,"203":120000,"302":130000,"402":130000,"301":150000,"401":150000}`
- **Lưu ý khi sửa:** Căn chưa có trong danh sách → Desk tạm tính theo `adhoc_cleaning_fee` và báo "Chưa có phí dọn thuê tháng cho căn này" để lễ tân thêm dòng phần chênh như hiện nay. Đổi hạng một căn thì sửa số của căn đó cùng lúc với giá căn. Yêu cầu dọn khách đã gửi giữ giá lúc gửi. Ai sửa: Chủ đầu tư, Quản lý.

### Hoa hồng và thưởng (H2, V5-30) – mục này không ghi số

#### `short_stay_commission_pct` (đã có – đổi cách tính ở v1.0.5)

- Giữ khóa và hai khóa con (`staff`, `collaborator`); bảng nội bộ có một mức cho cả nhân viên sale và CTV, anh/chị nhập cùng một số.
- Từ v1.0.5, cơ sở tính theo bảng nội bộ 01/11 mục 5.1: tiền phòng **và** phụ thu người (sau miễn, giảm); không gồm phụ thu nhận sớm, trả muộn, F&B, dịch vụ. Đơn hủy hoặc không đến mà khách đã trả: tính trên số OTTIMO giữ lại. Người hưởng phải có trên đơn **trước khi khách nhận phòng**.
- Mã không còn số mặc định. Thiếu tỷ lệ → Desk báo "Chưa có tỷ lệ hoa hồng", không tính bằng 0.

#### `long_stay_commission` (tên đề xuất)

- **Ý nghĩa:** Tỷ lệ hoa hồng HĐ thuê tháng theo **khoảng kỳ hạn** và theo **khách VN / khách NN** (BR-009), và tỷ lệ chi ở đợt 1.
- **Đơn vị:** `{"bands":[{"fromMonths": số, "toMonths": số hoặc null, "vnPct": %, "foreignPct": %}], "firstInstalmentPct": %}`
- **Giới hạn:** Tỷ lệ 0–100, tối đa 2 chữ số thập phân. Các khoảng nối liền nhau từ 1 tháng, không chồng nhau; khoảng cuối để `toMonths` = null (không giới hạn). Desk từ chối lưu nếu còn kỳ hạn không thuộc khoảng nào. · **Mặc định:** Không có.
- **Ví dụ:** (không ghi số) HĐ 6 tháng, khách hộ chiếu nước ngoài → Desk lấy `foreignPct` của khoảng chứa 6 tháng.
- **Đội đề xuất:** Theo bảng nội bộ 01/11 mục 5.2. Kỳ hạn bảng nội bộ không ghi riêng: xem ESC-051 câu 2 (đề xuất A: áp dòng ngắn hơn liền kề, như ESC-045 câu 2).
- **Lưu ý khi sửa:** Chỉ chủ đầu tư. Không gửi số cho đội. HĐ giữ tỷ lệ của ngày ký.

#### `manager_performance_bonus_pct` (tên đề xuất)

- **Ý nghĩa:** Tỷ lệ thưởng hiệu suất tháng cho quản lý, tính trên tiền phòng đã thu của tháng (định nghĩa cơ sở: ESC-051 câu 3).
- **Đơn vị:** % · **Giới hạn:** 0–100, tối đa 2 chữ số thập phân · **Mặc định:** Không có.
- **Đội đề xuất:** Theo bảng nội bộ 01/11 mục 6.
- **Lưu ý khi sửa:** Tỷ lệ có hiệu lực ngày 1 của tháng áp cho cả tháng đó. Chỉ chủ đầu tư.

#### `commission_payable_day`, `commission_pay_by_day` (đã có)

- Bảng nội bộ ghi "trả cùng kỳ lương". Anh/chị kiểm hai ngày này khớp ngày trả lương; đổi thì lưu với Hiệu lực từ trước ngày chốt.

## Lịch sử

| Ngày | Bản | Người | Nội dung |
|---|---|---|---|
| 06/11/2026 | 1.0 | DOM | Bản đầu, 198 tham số theo danh mục production 06/11. |
| 06/11/2026 | 1.1 | DOM | QC Round 4 ĐK-6, V5-1A: `night_from_month_divisor` đổi nhãn thành [Giá]. Khóa vẫn có tác dụng ở đường API (tạo căn, đổi giá thiếu giá đêm, công cụ nhập danh mục – BUG-R4-057); giữ 12, không sửa; gỡ ở v1.0.5. Ghi chú v1.0.5 ở `adhoc_cleaning_fee`, `short_stay_commission_pct`, `foc_alert_count_per_approver` (BR-438). Thêm mục "Sắp có ở v1.0.5" (H2, H3; không số hoa hồng; ESC-051). Bản `.json` sửa cùng mục `night_from_month_divisor` và ba ghi chú. |
| 06/11/2026 | 1.2 | DOM | Trả lời UXD bảng chữ v1.0.5 (`rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 8). Tên tiếng Việt cho 29 khóa theo `params.k.*` của UXD (V5-21), ghi "hiện từ v1.0.5"; `c3_stepup_minutes` đổi tên, nghĩa gồm cả xem số tài khoản nhận hoàn. `weekend_nights`: dạng đúng là mã thứ ["FRI","SAT"], không dùng số 1–7; chỉ ảnh hưởng mức tăng cuối tuần, không ảnh hưởng ở tối thiểu; không sửa tới khi sửa BUG-R5-001 (sửa cả mục `min_stay` và đoạn "các cặp phải đổi cùng nhau"). `hold_expiry_reminder_hours`: 0 = không nhắc. `rounding.night_rate`: bỏ "phụ thu" khỏi nghĩa (phụ thu theo `rounding.fee`). Bản `.json` sửa cùng các mục trên. |
| 06/11/2026 | 1.3 | DOM | Round 5 – Phản hồi & sửa (QA BUG-R5-001, BUG-R5-003; BA `a9927c78`). Lời dặn chung, dùng đúng câu BA ở sổ tay 1.4, 5.6, hướng dẫn `01` 9.2, 15.6, sổ vận hành 4.1: tới khi v1.0.5 lên, không bấm Lưu thay đổi ở `weekend_nights` (Đêm tính là cuối tuần) và `min_stay` (Ở tối thiểu); buộc phải đổi thì nhắn đội trước, Hiệu lực từ là ngày mai để còn Hủy lịch; lỡ lưu thì báo đội ngay, coi là P0. Sửa: Quy tắc chung bước 3, thêm bước 10 (ô JSON) và khung cảnh báo; đoạn "Các cặp phải đổi cùng nhau"; mục `min_stay` (bỏ câu sai "Desk kiểm đúng dạng khi lưu", thêm dạng đúng, ví dụ sai, Lưu ý khi sửa); mục `weekend_nights` (Lưu ý khi sửa, bỏ "Hiệu lực từ: hôm nay"); mục "Sắp có ở v1.0.5" thêm phần V5-25 (dạng lưu `min_stay` theo `rules-v1.0.5.md` mục 12). Bản `.json` sửa cùng `min_stay`, `weekend_nights`. |
| 06/11/2026 | 1.4 | DOM | Review PR #96 (V5-25) và `damage_catalog` (ORC 06/11). Dòng **Giới hạn**: 12 khóa ghi "v1.0.4 chưa kiểm, từ v1.0.5 chỉ nhận …" (`special_dates`, `los_discount`, `cancel_policy_direct`, `early_checkin_tiers`, `late_checkout_tiers`, `early_departure_refund`, `checkout_reminders`, `max_open_holds_per_user`, `lease_terms`, hai khóa `*_uplift_channels`, `damage_catalog`); 10 khóa danh sách ghi "chưa kiểm, kể cả v1.0.5"; 6 khóa chữ ghi "chỉ kiểm là chữ". Mục Sắp có ở v1.0.5 thêm phần 12 khóa. `min_stay`: `short_stay_max_nights` "đề xuất 29" thay "đang 29" (production còn thấp hơn tới khi làm B5). Luật: `rules-v1.0.5.md` mục 13. Không đổi giá trị đề xuất nào. |
| 07/11/2026 | 1.5 | DOM | Round 5 – Phản hồi & sửa, sau khi #121 (V5-1A) gộp vào main `491b8abd` (nhánh @ `f1993e04`). Theo DOM review #121 mục 1.3 và plan ĐK-6. `night_from_month_divisor`, dòng **Đội đề xuất**: từ v1.0.5 (#121) khóa không còn được đọc, sửa số này không đổi gì; khóa còn hiện trên màn Tham số tới khi đội dọn; bỏ vế "đội ẩn khỏi màn hình" (#121 không ẩn khóa). Giữ 12. Ý nghĩa, Lưu ý khi sửa giữ nguyên vì production còn v1.0.4. Bản `.json` sửa cùng `recommended_reason`. |
