# Bảng chữ v1.0.5 – Gói 2 "Chữ và tham số theo bảng giá 01/11"

- Lập: UXD · Round 5 – Sản xuất · 06/11/2026 · Bản 1.0 (`6b3700c6`).
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.1**: áp review CPY (`rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`, 11 thẻ). Chỗ đổi gồm:
  - mục 0 (số khóa);
  - 4.1 (U+00A0), 4.6 (`gw.lang_auto_sr`), 4.8 (ngoặc ở VI, ca chờ DOM);
  - 4.20 ("căn" trên chữ VI gửi khách), 4.21 (dấu "!" khác, chờ PO);
  - 5.1 ("Предоплата", 3 câu `msg.*`, `gw.req.clean_long_fee`), 5.3 (kiểm tự động);
  - mục 6, 7, 8.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.2**: áp trả lời DOM (`rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 8 và 10). Chỗ đổi gồm:
  - mục 0 (số khóa);
  - 4.3 (G6: một câu cho `penalty` và `damage`);
  - 4.8 (thẻ CPY 04: `bill.line.late_fee_after_limit` vào bảng chính);
  - 4.14 (FB-R5-DOM-UXD-01: bỏ vế "Bạn sẽ được nhắc…", thay bằng giờ hạn; bỏ dạng số nhiều);
  - mục 6, 7, 8.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.3**: áp thẻ FB-R5-CPY-UXD-V105-12 (CPY lượt 3, mục 12 tệp review). Chỉ đổi chữ 3 câu `sale.hold_next*` ở 4.14 (sale, CTV tự bấm Gia hạn giữ chỗ), cùng mục 0, 7, 8. Số khóa không đổi.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.4**: thêm mục 9, chữ Desk nội bộ ngoài Gói 2 theo DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` (`e9e0e2e4`): 9.1 hộp ghi tiền về cho đơn đã hủy (V5-5B, DOM 11.4), 9.2 câu lỗi khi lưu `min_stay` sai dạng (V5-25, DOM 12.7). Cùng mục 0, 6, 8. Chữ Desk nội bộ, không cần CPY.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.5**: mục 9.1 theo ARC 0.3.13 bổ sung 1c (PR #94, mục 1.21, nhánh `r5-contract-0313` @ `2cb549cc`) và DOM 11.4 (`5ad26fc1`): mã hoàn `payment_after_cancel`, "Có thể trùng", nơi nhận hoàn cố định, ảnh chứng từ do chủ đầu tư hoặc quản lý gửi, nhắc tìm đơn mới, mã giao dịch tùy chọn và 409 `DUPLICATE_BANK_REFERENCE`; mục 9.1a mới cho V5-48 (409 `INVALID_TRANSITION` trên đơn đã đóng). Mục 9.3 mới cho V5-1A: cảnh báo giá đêm khác thường `NIGHTLY_PRICE_UNUSUAL` (DOM 1.2 ý 6, `1568e523`). Theo BE PR #96 (V5-25): 9.2 sửa ca thiếu `channels` (máy chủ trả `allowed`) và ca quá 20 luật; mục 9.4 mới, câu lỗi chung cho 11 khóa có cấu trúc. Mục 9.5 mới cho V5-16 (US-177, BR-438; PO `6cfa6085`, ARC 0.3.13 mục 1.20). Cùng mục 0, 6, 8.
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
| V5-23 Chữ sai sự thật | 48 | 19 | 2 | **69** | Gồm 25 khóa EN thêm U+2011. 3 khóa ở mục 4.19 là phát hiện thêm, PO quyết. Bản 1.1 thêm 6 khóa: `gw.req.clean_makeup_free` và `gw.req.clean_second_fee` (4.20 a, bắt buộc), `gw.lang_auto_sr` (4.6), 3 khóa ở 4.21 (nên có). Bản 1.2: 4.14 còn 3 khóa (2 sửa, 1 mới) thay cho 6 mới và 2 xóa; thêm `bill.line.late_fee_after_limit` (4.8) |
| V5-24 Tiếng Nga | 8 | 0 | 0 | **8** | Bản 1.1 thêm `gw.req.clean_long_fee`. `sale.quote_text`, `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue` đổi thêm cột VI và/hoặc EN, vẫn đếm một lần ở đây. Kèm yêu cầu font (mục 5.2) |
| V5-5B Tiền về sau khi hủy (bản 1.4, 1.5, mục 9.1) | 0 | 26 | 0 | **26** | Ngoài Gói 2. Đi cùng 5B-1. Bản 1.4: 13 khóa. Bản 1.5: thêm 13 (gồm `audit.reason.payment_after_cancel`, trước là khóa có điều kiện). 3 khóa để sẵn cho 5B-2, chưa đếm |
| V5-48 Thu tiền trên đơn đã đóng (bản 1.5, mục 9.1a) | 0 | 3 | 0 | **3** | Ngoài Gói 2. Bắt buộc v1.0.5 (ARC 1.21 mục 2) |
| V5-25 Lưu tham số có cấu trúc (bản 1.4, 1.5, mục 9.2, 9.4) | 0 | 8 | 0 | **8** | Ngoài Gói 2. Đi cùng PR #96 (V5-25). Bản 1.4: 3 khóa `min_stay`. Bản 1.5: 5 khóa câu chung ở 9.4 |
| V5-16 Lễ tân sửa giảm dòng (bản 1.5, mục 9.5) | 0 | 7 | 0 | **7** | Ngoài Gói 2. Đi cùng US-177 (PR-B2). 2 khóa đóng ca để sẵn, chưa đếm |
| V5-1A Cảnh báo giá đêm khác thường (bản 1.5, mục 9.3) | 1 | 3 | 0 | **4** | Ngoài Gói 2. Đi cùng PR-C1 của BE (V5-1A) |
| **Tổng** | **72** | **115** | **7** | **194** | Bản 1.0: 143. Bản 1.1: 150. Bản 1.2, 1.3: 146 (Gói 2). Bản 1.4: 162 |

Mức theo PO (plan R5 mục 6, quyết định 15):
- **Bắt buộc:** mọi khóa, trừ các khóa dưới đây.
- **Nên có, làm cùng lượt C5:** 4.20 (b), 4.21, thẻ 06 và 08 ở 5.1. Không kịp thì chuyển US-125 (B-SAU). Không chặn QC.
- **Xếp sau:** 5.3 (kiểm tự động).
- 3 câu `sale.hold_next*` (4.14): bản 1.3 dùng nguyên chữ CPY (thẻ 12), không còn chờ.
- **v1.0.6:** 4.20 (c) và C6.
- **Mục 9 (bản 1.4, 1.5):** theo lịch của việc đi kèm, không theo Gói 2. 9.1 lên cùng V5-5B (5B-1; PO xếp v1.0.5 nếu kịp, không thì v1.0.6). 9.1a lên cùng V5-48 (bắt buộc v1.0.5). 9.2 và 9.4 lên cùng V5-25 (PR #96). 9.3 lên cùng V5-1A (PR-C1). 9.5 lên cùng V5-16 (US-177, Must v1.0.5; 403 ở PR-B2, bộ lọc ở PR-B1).

Kết quả CPY duyệt: mục 7. Yêu cầu cho FE, BE: mục 6.

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
| `bill.line.early_departure_fee_notice_one` | Mới | – | Phí trả phòng sớm (báo trước {noticeDays} ngày) | Early departure fee ({noticeDays} day's notice) |
| `bill.line.early_departure_fee_notice_other` | Mới | – | Phí trả phòng sớm (báo trước {noticeDays} ngày) | Early departure fee ({noticeDays} days' notice) |

Bản 1.1 (FB-R5-CPY-UXD-V105-03): ở cả VI và EN của `_notice_one` và `_notice_other`, khoảng trắng ngay sau `{noticeDays}` là **U+00A0** (khoảng trắng không ngắt). Hai dòng trên đã dùng U+00A0 ở đúng chỗ đó. Trong `gen_strings.py`, gõ thẳng ký tự này như 3 chỗ U+00A0 đã có, không gõ 6 ký tự `\u00A0`. Test so chữ lấy bằng `tv(key)`.
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
| `stay.charge_penalty_note` | Mới | – | Phí phạt và tiền bồi thường hư hỏng không tính vào doanh thu phòng. | Fines and damage charges don't count as room revenue. |

FE: ghép `stay.charge_penalty_note` sau `stay.charge_default` (StayDialogs 755), chỉ khi `item.category === 'penalty' || item.category === 'damage'`.

Bản 1.2 (DOM `rules-v1.0.5.md` mục 8.1, G6): DOM chốt hiện câu cho cả `penalty` và `damage`, dùng chung một câu. Hai nhóm cùng là "Phạt & bồi thường" trong Doanh thu khác (K-07), không vào doanh thu phòng (K-06). UXD lấy nguyên chữ DOM đề xuất. Câu nói cả hai khoản, nên đúng với cả hai nhóm. Giữ tên khóa `stay.charge_penalty_note` để FE không phải đổi tên. Các nhóm khác (minibar, giặt, dọn lẻ, phí dịch vụ) không hiện câu này.

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

Chỗ dùng:
- HomePage 52 (dòng chữ dưới lời chào, khi khách chưa tự chọn ngôn ngữ);
- GuestShell 66: trước bản 1.1, câu này còn làm mô tả cho trình đọc màn hình của ô chọn ngôn ngữ (xem dòng `gw.lang_auto_sr` bên dưới).

Ca `TC-L7-053` (`ui/guest-web.h18.spec.ts:293`) đang đánh dấu `test.fail` cho lỗi này. Khi chữ mới lên, QA bỏ đánh dấu và so bằng `tv('gw.lang_auto')`.

Bản 1.1 (FB-R5-CPY-UXD-V105-10, a11y, UXD nhận vào v1.0.5): GuestShell 66 dùng câu này làm `aria-describedby` của chính ô chọn ngôn ngữ (`#gw-lang-state`). Người dùng trình đọc màn hình đang đứng ở ô đó mà nghe "có thể đổi ở đầu trang" thì không hợp, và không biết trạng thái hiện tại. Câu cặp `gw.lang_chosen` thì nói trạng thái ("Language you chose").

| Khóa | Kiểu | Chữ mới EN | Chữ mới VI | Chữ mới RU | Chỗ dùng |
|---|---|---|---|---|---|
| `gw.lang_auto_sr` | Mới | Language selected for you | Ngôn ngữ đã chọn sẵn cho bạn | Язык выбран автоматически | Chỉ trong `span.sr-only#gw-lang-state` (GuestShell 66), thay `gw.lang_auto` khi `!chosen`. Câu không nói nguồn chọn, nên vẫn đúng tinh thần BUG-R2-218. Chữ do CPY viết |

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
| `bill.line.late_fee_as_night` | Mới | Phụ thu trả muộn (bằng giá 1 đêm) | Late check-out fee (one night's rate) |

Bản 1.1 (FB-R5-CPY-UXD-V105-05, UXD nhận): bản VI đặt phần cách tính trong ngoặc, cùng khuôn các dòng phiếu khác ("Phụ thu trả muộn ({time})", "Phí trả phòng sớm (báo trước…)") và cùng khuôn bản EN. Chữ Desk `co.late_fee_*` giữ nguyên. "Phụ thu" giữ trong v1.0.5 cho cùng họ với các dòng cũ. Đổi cả họ ở v1.0.6 (C6, mục 7).

BE-B (`folio/public/line-labels.ts`, case `late_checkout`): dòng có `chargeCode = 'late_fee_as_night'` trả `labelKey: 'bill.line.late_fee_as_night'`, không kèm `time`. Bỏ giờ khỏi dòng này vì khoản tính bằng giá một đêm, không theo giờ. Như vậy cũng hết ca "00:15" dễ đọc thành sáng của ngày dịch vụ. FE không cần sửa: `lineLabel` dùng `labelKey` khi `hasKey`.

**Bản 1.2 (FB-R5-CPY-UXD-V105-04, DOM `rules-v1.0.5.md` mục 10).** Nhãn `late_fee_as_night` khẳng định số tiền bằng giá một đêm. Điều đó đúng khi dòng do B18 ghi, và khi miễn hoặc giảm đi bằng dòng FOC riêng (BR-416, BR-433). DOM xác nhận vẫn có ca quản lý, chủ đầu tư **sửa thẳng** đơn giá hoặc số lượng dòng này (`folio-lines.service.ts` chỉ chặn `PRICE_NOT_EDITABLE` với lễ tân, lễ tân trưởng). Ca thường gặp là trên folio `settled`, trong cửa sổ sau trả phòng (A32, BR-433 (e)). Dòng thay thế giữ `charge_code`, `label_params` và `limit_ref_vnd` của dòng gốc. Ca đó cần nhãn không nói số tiền:

| Khóa | Kiểu | VI | EN |
|---|---|---|---|
| `bill.line.late_fee_after_limit` | Mới | Phụ thu trả muộn (rời sau mốc trả muộn) | Late check-out fee (after the late check-out limit) |

Chữ của CPY, DOM xác nhận đúng nghĩa BR-416 (khách rời sau mốc cuối, đêm ngày đi không bán được). Chữ khách cầm, cùng khuôn ngoặc với `late_fee_as_night`. "Phụ thu" giữ trong v1.0.5, đổi cùng họ ở v1.0.6 (C6).

BE-B chọn nhãn theo số tiền dòng:
- `amount_vnd` **bằng** `limit_ref_vnd` → `bill.line.late_fee_as_night`;
- **khác** (nhỏ hơn hoặc lớn hơn, ví dụ sửa số lượng) → `bill.line.late_fee_after_limit`.

Cả hai nhãn không kèm `time`. Dòng FOC riêng không đổi nhãn của dòng gốc: dòng 800.000 kèm FOC 400.000 vẫn ra `late_fee_as_night`. Ràng buộc `folio_line_limit_ref_required_check` (migration 0082) bảo đảm dòng `late_fee_as_night` luôn có `limit_ref_vnd`, nên không có ca thiếu số so.

Không chặn v1.0.5 nếu V5-16 (sửa giảm thẳng dòng phát sinh) không lên cùng bản: ca sửa thẳng của quản lý đã có từ trước V5-16.

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

QuoteDialog 773: hộp xanh luôn nói "Gửi mã QR cho khách", kể cả khi ngay dưới là câu đỏ `error.PAYMENT_NOT_CONFIGURED` ("Chưa cài tài khoản nhận chuyển khoản…") hoặc `dep.qr_failed`. Câu mới đúng cho cả hai ca.

**Bản 1.2 (FB-R5-DOM-UXD-01, Major; DOM `rules-v1.0.5.md` mục 8.2).** Vế "Bạn sẽ được nhắc {hours} giờ trước khi hết hạn" sai với v1.0.x, kể cả khi tham số > 0:
- tin nhắc J2 chỉ vào hộp thông báo của app nhân viên;
- sale, CTV không có màn nào trên app đó;
- Desk không có hộp thông báo, và trang Hôm nay (có Cần chú ý) chỉ mở cho OWN, MGR, FDL, FD.

Sale, CTV yên tâm chờ nhắc thì giữ chỗ tự hủy mà không ai báo khách. Bản 1.2 bỏ vế nhắc ở cả ba câu. Thay vào đó, câu nêu **giờ hạn**, điều xảy ra lúc đó, và việc người tạo phải làm. Câu không hứa nhắc mà cũng không nói "Desk không nhắc", vì lễ tân, quản lý tạo giữ chỗ trong hộp này vẫn thấy dòng "Giữ chỗ sắp hết hạn".

**Bản 1.3 (FB-R5-CPY-UXD-V105-12, Major).** Bản 1.2 bảo sale, CTV nhờ lễ tân gia hạn, là chỉ sai người làm. Sale, CTV tự gia hạn được giữ chỗ của mình: BR-303, `rbac-matrix.md` A03 (SAL, CTV "M"), `allowed-actions.ts` 74–76 (`extend_hold` khi `fd || sal || ctv`, chưa gia hạn lần nào, chưa quá hạn). Họ mở đơn ở "Đơn của tôi" và bấm nút **Gia hạn giữ chỗ (1 lần)**. Bản 1.3 dùng nguyên chữ CPY: vế cuối là việc tự làm, có tên nút; VI thêm "lúc" trước giờ; EN nói rõ mốc là giờ hạn. Tên nút trong câu phải khớp nguyên văn `drawer.action.extend_hold` (VI "Gia hạn giữ chỗ (1 lần)", EN "Extend hold (once)"). Đổi tên nút thì đổi cả 3 câu. Câu đúng với mọi vai và mọi giá trị `hold_expiry_reminder_hours`, kể cả 0 (DOM: 0 là không nhắc). Không còn `{hours}` nên bỏ dạng số nhiều. "Chưa cọc thì tự hủy" cùng chữ với `sale.hold_until` ngay trước bước tạo. Giữ chỗ có cọc một phần không tự hủy (báo đỏ cho quầy), nên câu không nói "chưa đủ cọc".

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `sale.hold_next` | Sửa | Gửi mã QR cho khách. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn. | Send the QR code to the guest. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires. | Sale nội bộ, mã QR đang tạo hoặc đã có |
| `sale.hold_next_ctv` | Sửa | Nhắn lễ tân hoặc sale nội bộ gửi mã VietQR cọc cho khách. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn. | Ask the front desk or sales staff to send the guest the deposit VietQR. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires. | CTV |
| `sale.hold_next_no_qr` | Mới | Thu cọc của khách theo hướng dẫn bên dưới. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn. | Collect the deposit as shown below. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires. | Sale nội bộ, `DepositQr` báo lỗi hoặc `PAYMENT_NOT_CONFIGURED` |

Bản 1.1 có 6 khóa `_one`/`_other` mới và xóa `sale.hold_next`, `sale.hold_next_ctv`. Bản 1.2 bỏ cả 6 khóa đó, giữ 2 khóa cũ (đổi chữ) và thêm 1 khóa `_no_qr`. FE chưa áp bản 1.1, nên không có gì phải gỡ.

FE:
- `{time}` lấy từ `held.holdExpiresAt` (giờ máy chủ trả, đã tính mốc chặn `holdLatestTime`). Định dạng như `sale.hold_until`: `timeHHmm` + `dayMonth` theo giờ Asia/Ho_Chi_Minh, ví dụ "15:30 07/11". Thiếu `holdExpiresAt` thì dùng `holdUntil` đã tính. Không truyền `hours`; `rules.holdWarnHours` không còn dùng ở đây;
- `DepositQr` báo ra ngoài khi lỗi (ví dụ thêm `onFail`, đối xứng với `onQr`);
- QuoteDialog chọn `sale.hold_next_no_qr` khi đã có lỗi và chưa có mã QR;
- trong lúc đang tạo, giữ `sale.hold_next`.

Ba câu này là chữ cho sale, CTV. CPY đã viết lại ở thẻ 12 (bản 1.3); áp nguyên văn.

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

### 4.20 Chữ "căn" trong chuỗi VI gửi khách (FB-R5-CPY-UXD-V105-02, bản 1.1)

"Căn" là từ nội bộ, gợi "căn hộ", trái với FB-INV-002. Landing đã chặn từ này (`dist-checks.mjs` dòng 281), trang khách đã dùng nhãn "Phòng" (`gw.room_label`), và bản EN đều là "Room". Chữ Desk nội bộ **giữ** "căn". Phạm vi theo PO (plan R5 mục 6, quyết định 15; `rounds/round-05/responses/PO-responses.md`).

**(a) Bắt buộc ở v1.0.5.** Chữ của CPY.

| Khóa | Kiểu | Chữ VI cũ | Chữ VI mới | Ghi chú |
|---|---|---|---|---|
| `sale.quote_text` (dòng 2) | Sửa (đã đếm ở 5.1) | Căn {room} {room_name}, {from} → {to} ({nights_text}), {guests}. | Phòng {room} {room_name}, {from} → {to} ({nights_text}), {guests}. | Báo giá VI gửi khách. Các dòng khác giữ nguyên. Sinh lại `quote-copy.ts` cùng lượt với bản RU. BA sửa sổ tay nếu có trích báo giá mẫu (V5-71) |
| `gw.req.clean_makeup_free` | Sửa | Hôm nay căn chưa được dọn – lần dọn này miễn phí. | Hôm nay phòng chưa được dọn – lần dọn này miễn phí. | Trang khách, xin dọn phòng. EN, RU giữ nguyên |
| `gw.req.clean_second_fee` | Sửa | Căn đã được dọn đầy đủ lúc {time} hôm nay. Dọn đầy đủ thêm lần nữa có phí {amount}. | Phòng đã được dọn đầy đủ lúc {time} hôm nay. Dọn đầy đủ thêm lần nữa có phí {amount}. | Như trên |

Toàn bộ `sale.quote_text` VI sau khi sửa (dòng nối bằng `\n` như hiện tại):

```
OTTIMO Boutique Stay – Báo giá {code}
Phòng {room} {room_name}, {from} → {to} ({nights_text}), {guests}.
Tiền phòng: {room_total}{discount_note}.
Cọc giữ phòng: {deposit}. Phần còn lại thanh toán khi nhận phòng.
Báo giá có hiệu lực đến {expires}.
```

**(b) Nên có ở v1.0.5, cùng lượt C5.** 3 mẫu tin đổi "căn {room}" thành "phòng {room}". Chữ đầy đủ ở mục 5.1, cùng chỗ với bản RU. Ba khóa này đã đếm ở 5.1. Không kịp thì chuyển US-125 (B-SAU). Phần này không chặn QC.

**(c) v1.0.6 (backlog R5-B-03, gộp C6):** các dòng phiếu `bill.line.room_night_room`, `bill.line.extra_night_room`, `bill.line.room_change`, và các khóa chưa dùng `guest.stay.room`, `guest.late.how_1`, `gw.room`. Câu CPY đã đề xuất nằm ở thẻ 02 (c). Không đổi ở bản này.

### 4.21 Dấu "!" ở các chuỗi khách khác (FB-R5-CPY-UXD-V105-07, bản 1.1)

Nên có ở v1.0.5, cùng lượt C5 (PO quyết định 15). Không kịp thì chuyển US-125. Không chặn QC. Chữ của CPY.
- Guideline tránh từ cảm thán, và landing đã chặn "!" bằng test.
- "a friendly reminder" là cụm sáo.
- `msg.bill` RU còn lệch ý EN: EN cảm ơn vì đã ở, RU lại cảm ơn vì đã chọn.

| Khóa | Kiểu | Ngôn ngữ | Chữ cũ | Chữ mới |
|---|---|---|---|---|
| `msg.house_rules_smoking` | Sửa | EN | Hi {name}, a friendly reminder: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you! | Hi {name}, a reminder from OTTIMO: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you. |
| | | VI | Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn! | Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút thuốc trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn. |
| | | RU | Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо! | Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо. |
| `msg.bill` | Sửa | RU | Спасибо, что выбрали OTTIMO, {name}! Счёт {bill_no}: {amount}. Подробнее: {link} | Спасибо, что остановились в OTTIMO, {name}. Счёт {bill_no}: {amount}. Подробнее: {link} |
| `guest.late.done_title` | Sửa | EN | All set! Your door code is ready | All set. Your door code is ready |
| | | VI | Xong! Mã cửa của bạn đã sẵn sàng | Đã xong. Mã cửa của bạn đã sẵn sàng |

Ghi chú:
- Lời chào RU "Здравствуйте, {name}!" **giữ** ở mọi mẫu. Đây là dấu câu quy ước sau lời chào có tên, đã đưa vào danh sách cho người bản xứ (CPY mục 3, câu 2).
- `guest.late.done_title` hiện chưa có mã nào dùng trong `apps/guest-web`. Vẫn sửa ở nguồn.
- Các bản RU vào danh sách cho người bản xứ.
- `msg.checkout_reminder` (giờ viết cứng) vẫn ở B-SAU. Không đổi ở đây.

---

## 5. V5-24 – Tiếng Nga

### 5.1 Bảy chuỗi hướng khách có từ cấm "апартаменты"

Nguồn: decision-log 04/11 (backlog v1.0.5), CPY-on-v104-p4-01 mục 0, CPY `privacy-2026-10-v2-ru.md` (ngoài phạm vi), SEC-on-privacy-v2-ru, UXD-on-privacy-v2-ru S3. Từ cấm theo `rounds/round-04/outputs/CPY/lp-v2-copy.md` (`/апартамент/iu`, `/квартир/iu`, `/посуточн/iu`).

Từ thay là **"номер"** (phòng khách sạn), từ CPY đã dùng và INV đã duyệt cho landing RU (lp-v2-copy 16.2: "номер" là phòng khách sạn, không dùng апартаменты/посуточно). Mọi chỗ chia đúng cách: "номер" (nguyên cách), "в номере" (giới cách), "он готов" (giống đực).

**0 trên 7 chuỗi nằm trong bản thông báo dữ liệu**, vì đó là các khóa `gw.notice_*`, và CPY xác nhận các khóa đó không có từ cấm. Như vậy không có chuỗi nào phải chờ B-PN, cả 7 vào v1.0.5.

CPY đã duyệt (C1, có điều kiện là thẻ 01; điều kiện đã áp ở bản 1.1).

| Khóa | Chữ RU cũ | Chữ RU mới | Chỗ dùng |
|---|---|---|---|
| `guest.stay.checkin_time` | Заезд с {time} (апартаменты всегда готовы к 14:00) | Заезд с {time} (номер всегда готов к 14:00) | Trang khách, trong lưu trú |
| `guest.oci.done_body` | Заезд с {time}, если апартаменты уже готовы; к 14:00 они готовы всегда. Код от двери администратор выдаст при заезде. | Заезд с {time}, если номер уже готов; к 14:00 он готов всегда. Код от двери администратор выдаст при заезде. | Trang khách, xong làm thủ tục trước |
| `gw.room` | Апартаменты | Номер | Không còn mã nào dùng (trang khách dùng `gw.room_label`). Vẫn sửa ở nguồn; xóa khóa ở v1.0.6 (4.20 c) |
| `sale.quote_text` (dòng 2 và 4) | Dòng 2: Апартаменты {room} {room_name}, … · Dòng 4: Депозит для бронирования: {deposit}. Остальное оплачивается при заселении. | Toàn bộ chữ mới ở khung dưới bảng | Báo giá gửi khách RU. Chạy lại `gen-quote-copy.mjs` (`services/api/src/generated/quote-copy.ts`) |
| `msg.booking_confirmed` | … бронирование {code}: апартаменты {room}, … (апартаменты всегда готовы к 14:00) … Предоплата {deposit}, остаток {balance} при заселении. … | Toàn bộ chữ mới ở khung dưới bảng | Mẫu tin (mục `TEMPLATES`) |
| `msg.deposit_received` | … по бронированию {code} (апартаменты {room}, {from} → {to}). … | Toàn bộ chữ mới ở khung dưới bảng | Mẫu tin |
| `msg.hot_water_issue` | … в апартаментах {room}. Техник придёт до {time}. Приносим извинения за неудобства! | Toàn bộ chữ mới ở khung dưới bảng | Mẫu tin |

**Chữ đầy đủ sau bản 1.1.** Có 3 thay đổi so với bản 1.0:
- `sale.quote_text` dòng 4 đổi "Депозит" thành "Предоплата" (thẻ 01, Major, bắt buộc);
- `msg.booking_confirmed` RU ghi rõ "получена" (thẻ 08);
- `msg.hot_water_issue` đổi cả 3 ngôn ngữ (thẻ 06, điều kiện C5).

Phần VI của 3 mẫu tin đổi "căn" thành "phòng" theo 4.20 (b). Thẻ 06, 08 và 4.20 (b) là mức nên có, làm cùng lượt C5. Không kịp thì chuyển US-125.

`sale.quote_text` RU:
```
OTTIMO Boutique Stay – предложение {code}
Номер {room} {room_name}, {from} → {to} ({nights_text}), {guests}.
Стоимость проживания: {room_total}{discount_note}.
Предоплата, чтобы закрепить номер: {deposit}. Остальное оплачивается при заселении.
Предложение действительно до {expires}.
```

`msg.booking_confirmed`:
- RU: Здравствуйте, {name}! OTTIMO подтверждает бронирование {code}: номер {room}, {from} → {to} ({nights_text}). Заезд с {checkin_time} (номер всегда готов к 14:00), выезд до {checkout_time}. Предоплата {deposit} получена, остаток {balance} — при заселении. Отмена: {cancel_policy_short}. Онлайн-регистрация для быстрого заселения: {link}
- VI: Chào {name}, OTTIMO xác nhận đặt phòng {code}: phòng {room}, {from} → {to} ({nights_text}). Nhận phòng từ {checkin_time} (phòng luôn sẵn sàng lúc 14:00), trả phòng trước {checkout_time}. Đã cọc {deposit}, còn {balance} khi nhận phòng. Hủy: {cancel_policy_short}. Làm thủ tục trước để nhận phòng nhanh: {link}
- EN: giữ nguyên.

`msg.deposit_received`:
- RU: Здравствуйте, {name}! OTTIMO получил предоплату {deposit} по бронированию {code} (номер {room}, {from} → {to}). Остаток {balance} оплачивается при заселении. Отмена: {cancel_policy_short}
- VI: Chào {name}, OTTIMO đã nhận cọc {deposit} cho đơn {code} (phòng {room}, {from} → {to}). Còn {balance} thanh toán khi nhận phòng. Chính sách hủy: {cancel_policy_short}
- EN: giữ nguyên.

`msg.hot_water_issue`:
- EN: Hi {name}, we've received your report of no hot water in room {room}. Our technician will be there by {time}. We're sorry for the inconvenience.
- VI: Chào {name}, OTTIMO đã nhận được tin báo phòng {room} không có nước nóng. Kỹ thuật viên sẽ đến trước {time}. Xin lỗi bạn vì sự bất tiện này.
- RU: Здравствуйте, {name}! Мы получили сообщение об отсутствии горячей воды в номере {room}. Техник придёт до {time}. Приносим извинения за неудобства.

Nếu lượt C5 không kịp v1.0.5, phải tách theo mức bắt buộc:
- `sale.quote_text` (thẻ 01 và 4.20 a) và 3 chuỗi trang khách (`guest.stay.checkin_time`, `guest.oci.done_body`, `gw.room`) vẫn **bắt buộc**;
- riêng 3 mẫu tin thì tối thiểu thay "апартаменты" bằng "номер" như bản 1.0.

Ghi chú:
- Bốn chuỗi `msg.*` hiện **chưa có mã nào gọi**: rà `services`, `apps`, `packages` không thấy chỗ dùng. Chúng chỉ nằm trong thư viện mẫu tin và content-guide. Vẫn sửa ở nguồn để lần nối mẫu tin sau không mang chữ cũ.
- Lời chào "Здравствуйте, {name}!" giữ "!". Đây là dấu câu quy ước sau lời chào có tên, đã đưa vào danh sách cho người bản xứ.
- Danh sách câu RU cho người bản xứ (11 câu, xếp theo rủi ro) nằm ở mục 3 của tệp review CPY. INV chuyển.

**Bản 1.1, thêm 1 khóa RU (FB-R5-CPY-UXD-V105-09).** "аренда" là chữ của thuê nhà, thuê căn hộ, cùng nhóm nghĩa với từ cấm "квартир". Câu cạnh nó (`gw.req.clean_fee_rule`) đã dùng "Долгосрочное проживание".

| Khóa | Kiểu | Ngôn ngữ | Chữ cũ | Chữ mới | Ghi chú |
|---|---|---|---|---|---|
| `gw.req.clean_long_fee` | Sửa | RU | Долгосрочная аренда не включает уборку. Каждая уборка стоит {amount}. | При долгом проживании уборка не входит в стоимость. Каждая уборка стоит {amount}. | Đang chạy (`RequestsPage.tsx` 262). Đúng BR-204, BR-506 |
| | | EN | Your long-stay rent doesn't include cleaning. Each clean costs {amount}. | Cleaning isn't included in long stays. Each clean costs {amount}. | Tùy chọn của CPY, UXD nhận để EN bỏ cùng chữ "rent" như RU |
| | | VI | Gói thuê dài hạn của bạn chưa gồm dọn phòng. Mỗi lần dọn có phí {amount}. | (giữ) | CPY: VI có thể giữ |

"аренд" **không** vào danh sách chặn tự động, vì hợp đồng dài hạn dùng đúng chữ này. Chỉ tránh trên chữ khách đọc.

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


### 5.3 Kiểm tự động chữ khách (FB-R5-CPY-UXD-V105-11, bản 1.1)

Yêu cầu cho FE-B, xếp **sau** khi đã áp 4.20 (a) và (b) (PO quyết định 15). Kiểm trên các khóa hướng khách `guest.*`, `gw.*`, `msg.*`, `sale.quote_text*`, `bill.line.*` của `strings-{vi,en,ru}.json`. Bật dần từng mẫu theo phần đã áp, để CI không đỏ vì phần còn Deferred.

| Bước | Mẫu | Ngôn ngữ | Bật khi |
|---|---|---|---|
| 1 | `/апартамент\|квартир\|посуточн/iu` (cùng danh sách `landing-web/scripts/dist-checks.mjs:324`) | RU | Ngay khi áp 5.1 |
| 2 | `/депозит/iu` | RU | Ngay khi áp thẻ 01 |
| 3 | `/(?<!\p{L})căn(?!\p{L})/iu` (giống `dist-checks.mjs` dòng 281) | VI | Sau 4.20 (a) và (b). Chừa các khóa 4.20 (c) cho tới v1.0.6 |
| 4 | không "!" và không emoji | mọi ngôn ngữ | Sau 4.21 và thẻ 06. RU chừa đúng mẫu `^Здравствуйте, \{name\}!` cho tới khi người bản xứ trả lời |
| 5 | `/phụ thu/iu` | VI | Sau C6 (v1.0.6) |

Ghi chú: trong bảng, `\|` là dấu "hoặc" của regex, viết thoát để không vỡ bảng Markdown. Trong mã, viết `|`.

## 9. Chữ thêm ở bản 1.4, 1.5 (ngoài Gói 2)

Chữ Desk nội bộ (VI, EN). Không có chữ cho khách, không cần CPY. Mã lỗi, tên `extras` và tên mã lý do do ARC chốt; bảng dưới gọi theo nghĩa, FE nối với mã ARC chốt.

### 9.1 Ghi tiền về cho đơn đã hủy (V5-5B, 5B-1; DOM 11.4)

Ca: khách chuyển tiền vào tài khoản OTTIMO sau khi đơn đã hủy hoặc đã đánh dấu không đến, ví dụ chuyển theo mã QR cũ. Luật DOM:
- chỉ FD+ ghi;
- chỉ chuyển khoản, VietQR;
- ảnh chứng từ và ghi chú bắt buộc. Ảnh là thông báo tiền vào tài khoản OTTIMO do chủ đầu tư hoặc quản lý gửi; không dùng ảnh chụp, SMS khách gửi hay ảnh sale, CTV chuyển tiếp;
- khoản thu luôn chờ đối soát;
- trong cùng giao dịch tạo yêu cầu hoàn đủ số, không phí, mã `payment_after_cancel`. Người ghi không tự duyệt, không chi;
- nơi nhận hoàn cố định `original_method`: chuyển khoản về đúng tài khoản khách đã chuyển. Không chi tiền mặt, không đổi nơi nhận;
- "Có thể trùng" (`possibleDuplicateCodes`) ở màn duyệt hoàn và màn đối soát: khoản chuyển khoản, VietQR khác, chưa đảo, cùng số tiền, Giờ nhận tiền cách ≤ 24 giờ, ở đơn khác. Chỉ hiện mã đơn, không chặn;
- mã giao dịch ngân hàng (`bankReference`) tùy chọn. Có mã mà trùng một khoản thu chưa đảo của cơ sở thì 409 `DUPLICATE_BANK_REFERENCE`.

Một khoản tiền chỉ ghi một lần, nên hộp phải nói rõ hai điều: khách muốn đặt lại thì không ghi ở đây; và trước khi ghi, tìm đơn mới của khách.

Dùng lại, không đổi chữ:
- `pay.bank_transfer`, `pay.vietqr` (hai lựa chọn duy nhất của ô cách thanh toán);
- `deposit.received_at` (Giờ nhận tiền);
- `pay.pending_reconcile` (Chờ đối soát);
- `today.money_after_cancel` (dòng Cần chú ý "Tiền về cho đơn đã hủy {code}").

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `drawer.action.money_after_cancel` | Mới | Ghi tiền về sau khi hủy | Record money received after cancellation | Nút trên khung đơn `cancelled`, `no_show`. Chỉ FD+, không hiện cho sale, CTV |
| `rsv.after_cancel.title` | Mới | Ghi tiền về cho đơn đã hủy {code} | Record money for cancelled booking {code} | Tiêu đề hộp |
| `rsv.after_cancel.intro` | Mới | Ghi khoản này sẽ tạo yêu cầu hoàn đủ số tiền, không phí. Khách muốn đặt lại: không ghi ở đây. Tạo giữ chỗ mới, xác nhận cọc trên đơn mới, ghi chú giờ tiền về và mã đơn {code}. | Recording this creates a refund request for the full amount, with no fee. If the guest wants to book again, don't record it here. Create a new hold, confirm the deposit on the new booking, and note the time received and booking {code}. | Khung cảnh báo đầu hộp, luôn hiện. Câu đầu theo chữ DOM 11.4 mục 3 |
| `rsv.after_cancel.find_new` | Mới (1.5) | Trước khi ghi: tìm đơn mới của khách theo tên hoặc số điện thoại. Đơn mới đã xác nhận cọc bằng khoản này thì không ghi ở đây. | Before recording, search for a new booking for this guest by name or phone number. If a new booking already used this money as its deposit, don't record it here. | Dòng thứ hai của khung cảnh báo, ngay dưới `rsv.after_cancel.intro`, luôn hiện (DOM 11.4 mục 3b) |
| `rsv.after_cancel.methods_hint` | Mới | Chỉ ghi tiền đã vào tài khoản OTTIMO: chuyển khoản hoặc VietQR. Khách đưa tiền mặt hay quẹt thẻ: tạo đơn mới và thu trên đơn mới. | Only money already in OTTIMO's account: bank transfer or VietQR. Cash or card at the desk: create a new booking and take the payment there. | Dòng phụ dưới ô cách thanh toán |
| `rsv.after_cancel.proof` | Mới (sửa ở 1.5) | Ảnh chứng từ tiền vào tài khoản OTTIMO (bắt buộc) | Proof of the payment into OTTIMO's account (required) | Nhãn ô ảnh (`deposit_receipt`) |
| `rsv.after_cancel.proof_help` | Mới (1.5) | Ảnh chủ đầu tư hoặc quản lý gửi, thấy số tiền, giờ và nội dung chuyển khoản. Không dùng ảnh chụp hay SMS khách gửi, cũng không dùng ảnh sale, CTV chuyển tiếp. | A photo sent by the owner or a manager, showing the amount, time and transfer reference. Don't use a screenshot or text message from the guest, or one forwarded by sales or an agent. | Dòng phụ dưới ô ảnh |
| `pay.bank_reference_optional` | Mới (1.5) | Mã giao dịch ngân hàng (nếu ảnh có) | Bank transaction reference (if shown in the photo) | Ô tùy chọn khi ghi chuyển khoản, VietQR. Mọi hộp ghi thu, không riêng đơn đã đóng |
| `pay.bank_reference_help` | Mới (1.5) | Không bắt buộc. Gõ đúng mã trên ảnh; Desk báo nếu mã này đã được ghi ở đơn khác. | Optional. Type the reference exactly as shown; Desk tells you if it was already recorded on another booking. | Dòng phụ dưới ô trên |
| `rsv.after_cancel.note_hint` | Mới (sửa ở 1.5) | Ví dụ: tiền về 14:05 06/11 theo mã {code}. Không ghi tên khách, tên người chuyển hay số tài khoản. | For example: received 14:05 06/11 with reference {code}. Don't write the guest's name, the sender's name or any account number. | Chữ gợi ý ô Ghi chú (bắt buộc) |
| `rsv.after_cancel.submit` | Mới | Ghi khoản thu và tạo yêu cầu hoàn | Record payment and create refund request | Nút chính |
| `rsv.after_cancel.done` | Mới | Đã ghi {amount} cho đơn {code}, chờ đối soát. Yêu cầu hoàn {amount} đã tạo – cần quản lý duyệt. Bạn là người ghi nên không tự duyệt. | {amount} recorded for booking {code}, awaiting reconciliation. A refund request for {amount} was created – a manager must approve it. You recorded it, so you can't approve it yourself. | Thông báo sau khi ghi |
| `field_error.after_cancel_method` | Mới | Đơn đã hủy chỉ ghi được chuyển khoản hoặc VietQR. Tiền mặt, thẻ: tạo đơn mới và thu trên đơn mới. | A cancelled booking only takes bank transfer or VietQR. For cash or card, create a new booking and take the payment there. | 422 `VALIDATION_FAILED` (`method`, `NOT_IN_LIST`) |
| `field_error.after_cancel_proof` | Mới (sửa ở 1.5) | Cần ảnh chứng từ tiền vào tài khoản OTTIMO trước khi ghi. | Attach proof of the payment into OTTIMO's account first. | 422 `REQUIRED` (`attachmentId`) |
| `field_error.after_cancel_proof_from_notice` | Mới (1.5) | Ảnh này đã gửi kèm báo chuyển cọc của sale, CTV, nên không dùng làm chứng từ. Dùng ảnh chủ đầu tư hoặc quản lý gửi. | This photo came with a sales or agent deposit report, so it can't be used as proof. Use a photo sent by the owner or a manager. | 422 `NOT_IN_LIST` (`attachmentId`) |
| `error.DUPLICATE_BANK_REFERENCE` | Mới (1.5) | Mã giao dịch này đã ghi ở đơn {code}. Không ghi lại. Báo quản lý kiểm sao kê. | This transaction reference is already recorded on booking {code}. Don't record it again. Ask a manager to check the statement. | 409, `{code}` = `duplicateReservationCode`. Mọi hộp ghi thu có `bankReference`. Không ghi gì |
| `today.money_after_cancel_not_found` | Mới | Không thấy tiền | Money not found | Nút ở dòng Cần chú ý `deposit_after_cancel`, FD+. Đóng dòng khi chưa thấy tiền về |
| `today.money_after_cancel_not_found_note` | Mới | Ghi chú (bắt buộc): đã kiểm ở đâu, lúc nào. | Note (required): where and when you checked. | Ô ghi chú của nút trên |
| `rsv.notice.after_cancel_sent` | Mới | Đã báo lễ tân. Đơn đã hủy nên lễ tân kiểm tiền về rồi xử lý. | The front desk has been told. The booking is cancelled, so they'll check the money and handle it. | Sale, CTV bấm Báo đã chuyển cọc trên đơn đã đóng (thay 409; mã trả về ARC chốt) |

**Yêu cầu hoàn tự tạo (bản 1.5).** ARC chốt mã mới `payment_after_cancel`, không dùng lại `overpayment`. Yêu cầu đứng tên người ghi; người ghi không duyệt, không chi. Nơi nhận cố định `original_method`: `setRefundDestination` và `executeCashRefund` trên yêu cầu này trả 409. FE ẩn nút **Nhập nơi nhận hoàn** và lối chi tiền mặt; câu lỗi dưới chỉ để dự phòng.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `audit.reason.payment_after_cancel` | Mới (1.5) | Tiền về sau khi hủy | Money received after cancellation | Nhãn `reasonCode = payment_after_cancel` ở cột Lý do, Cần duyệt, Hoàn tiền, như `audit.reason.overpayment` |
| `refund.after_cancel_note` | Mới (1.5) | Khách chuyển tiền sau khi đơn đã đóng. Hoàn đủ, không phí. Chỉ chi khi khoản thu đã đối soát. | The guest paid after the booking was closed. Refund in full, with no fee. Pay out only after the payment is reconciled. | Dòng giải thích ở chi tiết yêu cầu (Cần duyệt, Hoàn tiền) |
| `refund.after_cancel_destination` | Mới (1.5) | Nơi nhận cố định: chuyển khoản về đúng tài khoản khách đã chuyển. Không chi tiền mặt, không đổi nơi nhận, kể cả khi khách đứng ở quầy. Không hỏi số tài khoản của khách. | Fixed destination: a bank transfer back to the account the guest paid from. No cash, no change of destination, even if the guest is at the desk. Don't ask for the guest's account number. | Thay khối nơi nhận ở chi tiết yêu cầu này. Thay chữ `refund.method.original_method` ("Cùng cách khách đã trả") ở yêu cầu này |
| `refund.after_cancel_guest_line` | Mới (1.5) | Nói với khách: "Tiền hoàn sẽ về đúng tài khoản anh/chị đã chuyển." | Tell the guest: "The refund will be sent back to the account you paid from." | Dòng phụ dưới `refund.after_cancel_destination`. Câu trong ngoặc là câu nói với khách theo DOM 11.4 mục 3 |
| `error.refund_destination_fixed` | Mới (1.5) | Yêu cầu hoàn này chỉ chi bằng chuyển khoản về đúng tài khoản khách đã chuyển. Không đổi nơi nhận, không chi tiền mặt. | This refund can only be paid by bank transfer back to the account the guest paid from. The destination can't be changed and it can't be paid in cash. | 409 khi gọi `setRefundDestination` hoặc `executeCashRefund` trên yêu cầu `payment_after_cancel` |

**"Có thể trùng" (bản 1.5; bắt buộc khi 5B-1 lên).** Hiện ở màn duyệt hoàn (Cần duyệt, Hoàn tiền) và màn đối soát, khi `possibleDuplicateCodes` không rỗng. Chỉ hiện mã đơn. Không chặn nút: khách có thể chuyển thật hai lần cùng số.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `pay.possible_duplicate` | Mới (1.5) | Có thể trùng | Possible duplicate | Nhãn (chip) cạnh khoản thu hoặc yêu cầu hoàn. Tông cảnh báo, như các chip chờ đối soát |
| `pay.possible_duplicate_note` | Mới (1.5) | Đơn {codes} có khoản chuyển khoản cùng số tiền, cách dưới 24 giờ. Kiểm sao kê: một dòng sao kê chỉ khớp một khoản thu. Chỉ có một dòng: bấm Không thấy tiền ở khoản ghi sau, ghi chú "trùng khoản ở đơn …", rồi báo quản lý. | Booking {codes} has a transfer of the same amount within 24 hours. Check the statement: one statement line matches only one payment. If there's only one line, select Money not received on the later payment, note "duplicate of booking …", and tell a manager. | Dòng giải thích khi mở chip. `{codes}` nối bằng ", ". "Không thấy tiền" là chữ nút `co.recon_missing` |

Để sẵn cho 5B-2 (khôi phục), chưa đếm, thêm khi 5B-2 lên:

| Khóa | VI | EN | Khi nào |
|---|---|---|---|
| `rsv.after_cancel.restore` | Khôi phục giữ chỗ và xác nhận cọc | Restore the hold and confirm the deposit | Lựa chọn trong hộp, thay lối hoàn. Chỉ hiện khi đơn bị hủy lúc còn là giữ chỗ, căn cũ còn trống đủ đêm, chưa qua ngày đến |
| `rsv.after_cancel.restore_help` | Cùng mã đơn, cùng căn, cùng giá. Không tạo yêu cầu hoàn. Thiếu cọc thì đơn thành giữ chỗ có cọc một phần đã quá hạn. | Same booking code, room and rate. No refund request. If the deposit is short, the booking becomes an overdue hold with a part deposit. | Dòng phụ dưới lựa chọn |
| `error.after_cancel_restore_blocked` | Không khôi phục được: căn đã bán hoặc đã qua ngày đến. Chọn hoàn, hoặc mời khách căn khác. | This can't be restored: the room is sold or the arrival date has passed. Choose a refund, or offer the guest another room. | Lỗi khôi phục (mã ARC chốt; DOM gợi ý dùng lại mã của B12) |

### 9.1a Thu tiền trên đơn đã đóng – 409 ở Xác nhận cọc, VietQR (V5-48; ARC 1.21 mục 2)

Bắt buộc v1.0.5. `confirmPaymentReceived` và `createVietQr` trên đơn `cancelled`, `no_show` trả 409 `INVALID_TRANSITION` kèm `reservationStatus`. FE đọc `reservationStatus` **trước** `currentState`, vì `currentState` ở đây là trạng thái khoản thu, không phải của đơn (SEC 3.1). `{status}` lấy nhãn `status.booking.*` ("Đã hủy", "Không đến"). Câu chung `error.INVALID_TRANSITION` ("Đơn vừa chuyển sang…, tải lại") không dùng ở ca này: tải lại không giúp gì, người dùng cần biết làm gì với tiền.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `error.closed_booking_payment` | Mới (1.5) | Đơn này đã đóng ("{status}") nên không xác nhận cọc hay tạo mã VietQR được nữa. Tiền đã vào tài khoản OTTIMO: bấm Ghi tiền về sau khi hủy trên đơn. Khách muốn đặt lại: tạo giữ chỗ mới. | This booking is closed ("{status}"), so you can't confirm a deposit or create a VietQR code for it. If the money is already in OTTIMO's account, use Record money received after cancellation on the booking. If the guest wants to book again, create a new hold. | FD+, khi 5B-1 đã lên |
| `error.closed_booking_payment_no_5b1` | Mới (1.5) | Đơn này đã đóng ("{status}") nên không xác nhận cọc hay tạo mã VietQR được nữa. Tiền đã vào tài khoản OTTIMO: làm theo Tờ 2a, dòng "Tiền đã về mà đơn đã tự hủy". | This booking is closed ("{status}"), so you can't confirm a deposit or create a VietQR code for it. If the money is already in OTTIMO's account, follow sheet 2a, the line on money received after a hold was cancelled. | FD+, khi V5-48 lên trước 5B-1. Gỡ khóa này khi 5B-1 lên |
| `error.closed_booking_payment_sales` | Mới (1.5) | Đơn này đã đóng ("{status}") nên không tạo mã VietQR được nữa. Khách đã chuyển tiền: báo lễ tân kèm mã đơn. | This booking is closed ("{status}"), so you can't create a VietQR code for it. If the guest has already paid, tell the front desk and give the booking code. | Sale, CTV |

### 9.2 Câu lỗi khi lưu `min_stay` sai dạng (V5-25; DOM 12.1, 12.7)

Sau V5-25, `min_stay` sai dạng trả 422 `PARAM_OUT_OF_RANGE`. Theo DOM 12.1 và bộ kiểm của BE (PR #96, `parameter-shapes.ts`):
- `nights` thiếu, sai kiểu hoặc ngoài khoảng: `extras` có `min`, `max`;
- `channels` **thiếu** (`REQUIRED`), sai hoặc trùng, và `arrivalWeekdays` sai hoặc trùng: `extras` có `allowed` (oracle BR-113-23, 24, 25; 17, 18, 19);
- quá 20 luật: `extras` chỉ có `max` (= 20), `field` = `value`;
- các lỗi còn lại không có `extras`: không phải mảng, phần tử không phải đối tượng, khóa lạ, luật không áp vào ngày nào, `arrivalOnSpecialDates` là chữ.

Bản 1.5 sửa theo PR #96: bản 1.4 xếp "thiếu `channels`" và "quá 20 luật" vào câu dạng chung. Máy chủ trả `allowed` cho ca thiếu `channels`, nên Desk hiện câu "Chọn một trong" (bước 1 dưới), kèm chỗ cần sửa theo 9.4. UXD đồng ý với máy chủ, không cần ARC đổi: câu "Chọn một trong: all, direct, agent, ota" cho người sửa biết phải điền gì, còn câu dạng chung không nói thiếu ở luật nào.

Câu chung `_SHAPE` (mục 2.3) không chỉ được chỗ sai. Câu `_MINMAX` ("Giá trị phải từ 1 đến 7.") đọc như cả ô phải là một số. Vì vậy `min_stay` có câu riêng. Câu dạng lấy theo đề xuất của DOM, thêm một câu nói mỗi luật cần gì, để sửa lỗi gõ mà không phải mở từ điển.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `params.err_min_stay_shape` | Mới | Giá trị chưa đúng dạng danh sách luật. Mỗi luật cần nights (số đêm), channels (kênh) và ít nhất một ngày áp: arrivalWeekdays hoặc arrivalOnSpecialDates. Xem từ điển tham số, mục Ở tối thiểu. | This isn't a valid list of rules. Each rule needs nights, channels and at least one arrival day: arrivalWeekdays or arrivalOnSpecialDates. See the parameter dictionary, Minimum stay. | `min_stay`, 422 không có `allowed`, `min`, `max` |
| `params.err_min_stay_nights` | Mới | Số đêm (nights) của mỗi luật phải từ {min} đến {max}. | Each rule's nights must be from {min} to {max}. | `min_stay`, 422 có `min` và `max` |
| `params.err_short_stay_below_min_stay` | Mới | Phải từ {min} đêm trở lên, vì Ở tối thiểu đang có luật {min} đêm. | Must be at least {min} nights, because Minimum stay has a {min}‑night rule. | `short_stay_max_nights`, 422 chỉ có `min` (kiểm chiều ngược, DOM 12.2) |

FE (`app/problem.ts`, nhánh `PARAM_OUT_OF_RANGE`; ParamDialog biết khóa đang lưu), xét trước thứ tự 6 bước ở mục 2.3:
1. khóa `min_stay`, có `allowed` → câu chung 9.4, `{detail}` = `error.PARAM_OUT_OF_RANGE` ("Chọn một trong: all, direct, agent, ota" hoặc 7 mã thứ). Ví dụ BR-113-23: "Chỗ cần sửa: mục 1, channels. Giá trị này không có trong danh sách cho phép. Chọn một trong: all, direct, agent, ota. Xem dạng đúng trong từ điển tham số, mục min_stay.";
2. khóa `min_stay`, có `min` và `max` → `params.err_min_stay_nights`;
3. khóa `min_stay`, chỉ có `max` (quá 20 luật) → câu chung 9.4 dạng cả giá trị, `{detail}` = `error.PARAM_OUT_OF_RANGE_MAX`;
4. khóa `min_stay`, không có `extras` → `params.err_min_stay_shape`;
5. khóa `short_stay_max_nights`, chỉ có `min` → `params.err_short_stay_below_min_stay`;
6. 11 khóa ở 9.4: theo 9.4. Các khóa khác: theo mục 2.3.

JSON gõ sai (thiếu ngoặc, thiếu dấu ngoặc kép) vẫn báo `params.err_json` ở máy khách, trước khi gửi. `[]` lưu được (DOM 12.2), không có câu lỗi.

### 9.3 Cảnh báo giá đêm khác thường (V5-1A; DOM 1.2 ý 6, `1568e523`; ARC 0.3.13 `updateRoom`, `createRoom`)

Cảnh báo, **không chặn**. Điều kiện, so bằng số nguyên, đúng bằng biên thì không báo:
- thấp: giá đêm × 30 < giá tháng (BR-101 (4), Desk đang kiểm ở `rooms.night_low`);
- cao: giá đêm × 5 > giá tháng (biên trên mới, DOM chọn ÷ 5).

Giá tháng là giá tháng của cùng căn, cùng ngày hiệu lực với giá đêm đang lưu. Cảnh báo để bắt lỗi gõ: thừa số 0, gõ giá tháng vào ô giá đêm, sai một chữ số. Câu mở đầu theo DOM: "Giá đêm khác thường so với giá tháng."

**Nơi hiện.**
1. **Hộp đổi giá căn** (ngăn kéo căn, `RoomDrawer`): Desk tự kiểm cùng điều kiện **trước khi gửi**. Khung cảnh báo hiện dưới hai ô giá, ngay khi giá đổi. Nút **Lưu** đổi chữ thành `rooms.save_unusual_price`: một lần bấm chữ này là xác nhận lại, không mở thêm hộp. Chỉ đổi khi người dùng đã sửa ô giá. Sửa tên căn, giường mà giá cũ vốn khác thường thì nút vẫn là **Lưu**, khung vẫn hiện.
2. **Sau khi lưu**: phản hồi `updateRoom` có `warnings[]` chứa `NIGHTLY_PRICE_UNUSUAL`, tức Desk chưa bắt được (ví dụ giá tháng của ngày hiệu lực khác giá đang hiện). Khi đó toast lưu giữ chữ cũ (`rooms.saved` hoặc `rooms.saved_scheduled`) và thêm dòng `rooms.warn.nightly_price_unusual`, tông cảnh báo, không tự tắt.
3. **Tạo căn** (`createRoom`, công cụ nhập danh mục): Desk hiện không có màn tạo căn (ARC 0.3.13, V5-1A). Màn tạo căn sau này dùng đúng 3 khóa trên theo cùng cách. Công cụ nhập danh mục và script gọi API là việc của ORC, OPS: in mã căn kèm `NIGHTLY_PRICE_UNUSUAL`, không phải chữ Desk.

| Khóa | Kiểu | VI cũ | VI | EN | Khi nào |
|---|---|---|---|---|---|
| `rooms.night_low` | Sửa | Giá đêm đang thấp hơn giá tháng chia 30 ngày ({perDay} đ). Kiểm tra lại số; nếu đúng, vẫn lưu được. | Giá đêm khác thường so với giá tháng: thấp hơn giá tháng chia 30 ({perDay} đ). Kiểm lại trước khi lưu; nếu đúng, vẫn lưu được. | The nightly price looks unusual next to the monthly price: it is below the monthly price divided by 30 ({perDay} VND). Check it before saving. If it is right, you can still save. | Hộp đổi giá căn, giá đêm × 30 < giá tháng. `{perDay}` như cũ (giá tháng ÷ 30, làm tròn 1.000, chỉ số) |
| `rooms.night_high` | Mới | – | Giá đêm khác thường so với giá tháng: 5 đêm đã đắt hơn cả tháng ({month} đ). Kiểm lại trước khi lưu, nhất là số 0 thừa; nếu đúng, vẫn lưu được. | The nightly price looks unusual next to the monthly price: 5 nights cost more than the whole month ({month} VND). Check it before saving, especially for an extra zero. If it is right, you can still save. | Hộp đổi giá căn, giá đêm × 5 > giá tháng. `{month}` = giá tháng trong ô, chỉ số. Cùng `Alert tone="warn"` với `rooms.night_low`; hai điều kiện không thể cùng đúng |
| `rooms.save_unusual_price` | Mới | – | Vẫn lưu giá này | Save this price anyway | Chữ nút Lưu khi một trong hai câu trên đang hiện và ô giá đã sửa |
| `rooms.warn.nightly_price_unusual` | Mới | – | Giá đêm khác thường so với giá tháng. Giá đã lưu: kiểm lại hai giá của căn, sai thì sửa ngay. | The nightly price looks unusual next to the monthly price. The price is saved: check both prices for this room and correct them now if needed. | Dòng thêm trong toast lưu khi `warnings[]` có `NIGHTLY_PRICE_UNUSUAL`. Không dùng câu "Kiểm lại trước khi lưu" ở đây vì giá đã lưu |

Không thêm tham số cho hai biên (DOM: hằng số). Câu không ghi "÷ 5" hay "÷ 30" ở biên trên để người đọc hiểu ngay bằng ngày, tháng.

### 9.4 Câu lỗi chung cho khóa có cấu trúc (V5-25, BE PR #96)

Áp cho 11 khóa có bộ kiểm mới ở PR #96: `special_dates`, `los_discount`, `cancel_policy_direct`, `early_checkin_tiers`, `late_checkout_tiers`, `early_departure_refund`, `checkout_reminders`, `weekend_uplift_channels`, `special_uplift_channels`, `max_open_holds_per_user`, `lease_terms`. `min_stay` dùng ở bước 1 và 3 của 9.2.

Vấn đề: các khóa này là danh sách hoặc đối tượng JSON. `_MINMAX` ("Giá trị phải từ 0 đến 100.") đọc như cả ô phải là một số. `_SHAPE` không nói chỗ nào sai. Máy chủ báo chỗ sai đầu tiên ở `errors[0].field` (ARC 1.24), nên câu chung nói chỗ đó trước, rồi mới nói giá trị nhận.

**Giữ nguyên 6 bước ở mục 2.3.** Câu 2.3 chọn được ghép vào `{detail}`:
- có `allowed` (hai khóa `*_uplift_channels`, `max_open_holds_per_user` khi gõ sai vai) → `error.PARAM_OUT_OF_RANGE`;
- có `min` và `max` → `_MINMAX`; chỉ `max` → `_MAX`; chỉ `min` → `_MIN`;
- không có `extras` → `_SHAPE`.
`_GROUPS` chỉ cho `ota_base_rate`, không gặp ở đây.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `params.err_structured` | Mới | Chỗ cần sửa: {where}. {detail} Xem dạng đúng trong từ điển tham số, mục {key}. | Fix this part: {where}. {detail} See the correct format in the parameter dictionary, under {key}. | `errors[0].field` sâu hơn `value` |
| `params.err_structured_whole` | Mới | {detail} Xem dạng đúng trong từ điển tham số, mục {key}. | {detail} See the correct format in the parameter dictionary, under {key}. | `field` = `value`, hoặc không có `errors` |
| `params.where_item` | Mới | mục {n} | item {n} | `value[i]` |
| `params.where_item_field` | Mới | mục {n}, {field} | item {n}, {field} | `value[i].<khóa>` và sâu hơn (`value[i].channels[j]` → khóa `channels`) |
| `params.where_field_item` | Mới | {field}, mục {n} | {field}, item {n} | `value.<khóa>[j]` (ví dụ `value.before[3]` của `checkout_reminders`) |

Cách dựng `{where}` từ `errors[0].field`:
- `{n}` = chỉ số + 1 (máy chủ đếm từ 0, người đọc đếm từ 1);
- `{field}` = tên khóa con, giữ nguyên mã (`pct`, `minNights`, `refundPct`, `before`), vì ô JSON và từ điển dùng đúng mã này;
- `value.<khóa>` không có chỉ số → `{where}` = tên khóa con, không cần khóa chữ;
- chỉ lấy một chỉ số và một tên khóa đầu tiên, bỏ phần sâu hơn.

`{key}` = mã tham số (`los_discount`). Từ điển tham số đặt tên mục theo mã, và ParamDialog đã hiện mã dưới tên.

Ví dụ:
- `los_discount`, `value[1].pct` = 120, `{min: 0, max: 100}` → "Chỗ cần sửa: mục 2, pct. Giá trị phải từ 0 đến 100. Xem dạng đúng trong từ điển tham số, mục los_discount."
- `special_dates`, `value[0].from` = 30/02, không `extras` → "Chỗ cần sửa: mục 1, from. Giá trị này chưa đúng dạng, hoặc chưa khớp với tham số đi kèm. Xem dạng đúng trong từ điển tham số, mục special_dates."
- `early_departure_refund`, `value.refundPct` = −5 → "Chỗ cần sửa: refundPct. Giá trị phải từ 0 đến 100. Xem dạng đúng trong từ điển tham số, mục early_departure_refund."
- `lease_terms` 13 kỳ, `field` = `value`, `{max: 12}` → "Giá trị này vượt mức cho phép (12). Xem dạng đúng trong từ điển tham số, mục lease_terms."

Không đổi `params.err_json` (JSON gõ sai vẫn báo ở máy khách, trước khi gửi). Định dạng số theo mục 2.3; các khóa con ở đây không có đơn vị `vnd`, nên số in trần.

### 9.5 Lễ tân sửa giảm dòng phát sinh (V5-16; US-177, BR-438; ARC 0.3.13 mục 1.20)

Luật: lễ tân, lễ tân trưởng chỉ tự sửa giảm (bỏ dòng, giảm số lượng, giảm đơn giá) dòng **chính mình nhập tay trong ngày nghiệp vụ hiện tại**, xét theo dòng gốc. Mọi ca khác (dòng của người khác, dòng Desk tự ghi, dòng ngày trước) → 403 `FORBIDDEN_ACTION` + `requiredFlow: foc_request`, folio không đổi. Desk đưa sang **Gửi miễn có duyệt**. Quản lý, chủ đầu tư sửa như cũ.

Desk không tự đoán trước được: `FolioLine` không có nguồn `manual`, ngày nghiệp vụ ghi hay dòng gốc. Vì vậy hộp **Điều chỉnh** giữ nguyên lối sửa, có câu phụ báo luật từ đầu. Khi máy chủ từ chối thì hộp hiện câu chỉ dẫn và nút **Gửi miễn có duyệt**, mở form miễn phí cho đúng dòng đó. Chữ không lộ mã kỹ thuật (US-177 AC9).

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `folio.adjust_reduce_rule` | Mới | Lễ tân tự giảm hoặc bỏ được dòng chính mình nhập tay trong ngày nghiệp vụ hôm nay. Dòng khác cần Gửi miễn có duyệt. | Front desk staff can lower or cancel only the lines they entered by hand themselves on today's business day. Any other line needs a waiver request with approval. | Câu phụ trong hộp Điều chỉnh, dưới ô Bỏ cả dòng. Chỉ FD, FDL. Luôn hiện, không tùy dòng |
| `error.reduce_needs_foc` | Mới | Chưa ghi điều chỉnh. Dòng này không phải dòng bạn tự nhập tay hôm nay: dòng của người khác, dòng Desk tự ghi, hoặc dòng ngày trước. Bấm Gửi miễn có duyệt để người có quyền duyệt xem. | Adjustment not recorded. This isn't a line you entered by hand today: it was entered by someone else, added by Desk, or entered on an earlier day. Select Request a waiver (needs approval) so an approver can review it. | 403 có `requiredFlow = foc_request` ở `adjustFolioLine`. FE đọc `requiredFlow` trước, rồi mới tới câu chung `error.FORBIDDEN_ACTION`. Khung cảnh báo trong hộp, giữ số đã gõ |
| `folio.foc_request_btn` | Mới | Gửi miễn có duyệt | Request a waiver (needs approval) | Nút trong khung `error.reduce_needs_foc`. Mở form miễn phí của dòng đó, ô Số tiền điền sẵn phần định giảm (số cũ − số mới, bỏ dòng = cả dòng, không quá `foc.max`). EN theo `ci.ask_foc` |
| `foc.reduce_note` | Mới | Số tiền đã điền phần bạn định giảm. Chọn lý do (dòng ghi sai: Ghi nhầm) rồi Gửi duyệt. | The amount is filled in with what you meant to take off. Choose a reason (for a line entered wrongly: Entered in error), then send it for approval. | Dòng đầu form miễn phí khi mở từ nút trên. Mở form theo lối thường thì không hiện |
| `foc.r_entered_in_error` | Mới | Ghi nhầm | Entered in error | Lý do FOC `entered_in_error` (US-177 AC8): nút chọn lý do, cột Lý do, Cần duyệt, báo cáo FOC |
| `mlog.filter_reductions` | Mới | Sửa giảm dòng – 7 ngày | Line reductions – 7 days | Bộ lọc `reductionsOnly` ở Nhật ký tiền. Chỉ MGR, OWN (US-177 AC7 (i)) |
| `attn.line_reduction_count` | Mới | Một người đã tự sửa giảm dòng {count} lần tháng này – vượt ngưỡng {max} | One person has lowered or cancelled their own lines {count} times this month – over the limit of {max} | "Cần chú ý" `foc_threshold`, `check = line_reduction_count`. Cùng kiểu `attn.foc_count`: không tên, link lọc theo người |

Để sẵn, chưa đếm, thêm khi `ShiftReport.lineReductions[]` lên (v1.0.5 nếu kịp, không thì v1.0.6; DOM 7.2 ý 4):

| Khóa | VI | EN | Khi nào |
|---|---|---|---|
| `shift.line_reductions_title` | Dòng tự sửa giảm trong ca | Lines lowered or cancelled this shift | Tiêu đề khối ở danh sách đóng ca (BR-526 (d)) |
| `shift.line_reduction_row` | {code} · {line}: {before} → {after} · {reason} | {code} · {line}: {before} → {after} · {reason} | Một dòng mỗi lần. `{before}`, `{after}` dùng `money()`; `{reason}` = lý do người sửa gõ. Không tên khách |

Lưu ý cho PO, CPY (không chặn): bill khách in lý do miễn theo `bill.line.foc_reason` ("Miễn phí · {reason}"). Với `entered_in_error`, UXD đề xuất bill chỉ in `bill.line.foc` ("Miễn phí"), không in "Ghi nhầm". Lý do: đây là chữ nội bộ, khách không cần đọc. Số tiền trên bill không đổi.

---

## 6. Yêu cầu cho FE, BE (gom theo tệp)

| Vai | Tệp | Việc | Mục |
|---|---|---|---|
| FE-A | `design/tools/gen_strings.py` (+ sinh lại) | Áp mọi dòng Sửa, Mới, Xóa của bảng này. Ghi chú mỗi khóa: "v1.0.5 – V5-xx" | toàn bộ |
| FE-A | `app/rules.ts` | `RULE_DEFAULTS` theo mức đề xuất (30, 30) | 1.1 |
| FE-A | `quotes/QuoteDialog.tsx` | `n` cho `LONG_STAY_REQUIRES_CONTRACT`; gom đêm theo số tiền với `sale.nights_at_rate_*`; `sale.hold_next*` với `{time}` từ `held.holdExpiresAt` và nhánh `_no_qr`; `sale.quote_expires` truyền `expiresAt − 1 phút` | 1.1, 1.4, 4.7, 4.14 |
| FE-A | `booking/BookingDialog.tsx` | Khóa bản xem gồm số người; "–" và `aria-busy` khi chờ; chữ OTA chưa gõ giá; câu sàn–trần có số, dự phòng `rate_out_of_range_dates`; `role="alert"`, `aria-invalid` | 1.6, 3 |
| FE-A | `stay/CheckOutPage.tsx`, `stay/StayDialogs.tsx` | `rate.calendar_short` ở 2 chỗ luôn hiện; `stay.after_noon_hint` với `{time}`; `stay.agreed_time`; `stay.companion_field`; `stay.charge_penalty_note` khi `category` là `penalty` hoặc `damage` | 1.2, 1.5, 4.2, 4.3, 4.7 |
| FE-A | `stay/common.tsx`, `money/MoneyPage.tsx` | `StepUpDialog` thêm `purpose` | 4.4 |
| FE-A | `pages/paramCatalog.ts`, `ParamDialog.tsx`, `ParamsPage.tsx`, `app/problem.ts` | `KNOWN` cho 29 khóa, đơn vị `nights`; 6 nhánh câu `PARAM_OUT_OF_RANGE`; `params.err_*`; câu `ota_base_rate` | 2 |
| FE-A | `app/folio.ts` | Biến thể phí trả sớm (`_same_day`, số nhiều) | 4.1 |
| FE-A | `reservations/ReservationsPage.tsx`, `ReservationDialogs.tsx`, `pages/UsersPage.tsx`, `UserEmailDialog.tsx`, `webreq/*` | `rsv.list_empty_body_sales`; `money()` trong `DEPOSIT_INSUFFICIENT`; `INVALID_TRANSITION_generic(_reloaded)`; `users.email_purpose`; `webreq.pii_erased` | 4.7, 4.10, 4.12, 4.13, 4.16 |
| FE-A | test | Sửa các test nhắc khóa bị xóa hoặc chữ cũ, ví dụ `v104-rate-source-typed.test.tsx` (`bk.src_weekend`), test so `error.DEPOSIT_INSUFFICIENT`, `sale.hold_next` (bỏ `hours`, thêm `time`) | 1.3, 4.13, 4.14 |
| FE-B | `apps/guest-web` | `gw.lang_auto` 3 ngôn ngữ; `gw.lang_auto_sr` ở `#gw-lang-state` (GuestShell 66); 3 chuỗi RU trang khách; `gw.req.clean_*` (4.20 a, 5.1); font (5.2) | 4.6, 4.20, 5.1, 5.2 |
| FE-B | test chữ khách (`apps/guest-web` hoặc `packages/i18n`) | Kiểm tự động 5 bước ở mục 5.3, bật dần. Làm **sau** 4.20 (a), (b) | 5.3 |
| MOB | `apps/mobile` | Font (5.2). Kiểm các chuỗi U+2011 trên thẻ 362 px | 4.15, 5.2 |
| BE-A | `reservations.service.ts` 739–743 | `min`, `max` trong Problem `RATE_OUT_OF_RANGE` (theo ARC 0.3.13) | 3 |
| BE-B | `folio/public/line-labels.ts` | Dòng `chargeCode = 'late_fee_as_night'`: `amount_vnd` bằng `limit_ref_vnd` → `bill.line.late_fee_as_night`; khác → `bill.line.late_fee_after_limit`. Cả hai không có `time`. `LabelSource` cần thêm `amount_vnd`, `limit_ref_vnd`. Test: sửa đơn giá 800.000 → 400.000 ra `after_limit`; dòng 800.000 kèm FOC 400.000 vẫn ra `as_night` (DOM mục 10) | 4.8 |
| BE | `services/api/scripts/gen-quote-copy.mjs` | Chạy lại sau khi đổi `sale.quote_text` (RU dòng 2 và 4, VI dòng 2). `quote-copy.ts` không còn "Апартаменты", "Депозит", "Căn " | 4.20, 5.1 |
| FE-A | `reservations/ReservationDialogs.tsx` (hoặc tệp ARC chỉ), `pages/TodayPage.tsx` | Bản 1.4: nút và hộp ghi tiền về cho đơn đã hủy, nút Không thấy tiền ở Cần chú ý, câu báo cho sale, CTV. Bản 1.5: dòng tìm đơn mới, dòng phụ ảnh, ô mã giao dịch (mọi hộp ghi thu), 409 `DUPLICATE_BANK_REFERENCE`, 422 ảnh từ báo của sale. Lên cùng 5B-1 | 9.1 |
| FE-A | màn Cần duyệt, Hoàn tiền, Đối soát (`money/*`, `approvals/*`) | Bản 1.5: nhãn `payment_after_cancel`, khối nơi nhận cố định (ẩn Nhập nơi nhận hoàn, ẩn chi tiền mặt), chip và câu "Có thể trùng" khi `possibleDuplicateCodes` không rỗng. Lên cùng 5B-1 | 9.1 |
| FE-A | `pages/RoomDrawer.tsx` | Bản 1.5: thêm `nightlyHigh` (giá đêm × 5 > giá tháng) cạnh `nightlyLow`; chữ nút Lưu khi cảnh báo hiện và ô giá đã sửa; đọc `warnings[]` của `updateRoom` để thêm dòng vào toast. Lên cùng V5-1A | 9.3 |
| FE-A | `app/problem.ts`, hộp Xác nhận cọc, `DepositQr` | Bản 1.5: 409 `INVALID_TRANSITION` có `reservationStatus` → 3 câu 9.1a theo vai và theo 5B-1 đã lên hay chưa. Lên cùng V5-48 (bắt buộc v1.0.5) | 9.1a |
| FE-A | `app/problem.ts`, `pages/ParamDialog.tsx` | Bản 1.4: chọn câu lỗi riêng cho `min_stay`, `short_stay_max_nights` trước 6 bước ở 2.3. Bản 1.5: `min_stay` có `allowed` hay chỉ `max` dùng câu chung 9.4; 11 khóa có cấu trúc dựng `{where}` từ `errors[0].field`, ghép câu 2.3 vào `{detail}`. Lên cùng V5-25 (PR #96) | 9.2, 9.4 |
| FE-A | `pages/stay/FolioDialog.tsx` (hộp Điều chỉnh, form miễn phí), `app/problem.ts`, Nhật ký tiền, "Cần chú ý" | Bản 1.5: câu phụ cho FD, FDL; 403 `requiredFlow = foc_request` → câu chỉ dẫn và nút mở form miễn phí điền sẵn; lý do Ghi nhầm; bộ lọc `reductionsOnly`; `attn.line_reduction_count`. Lên cùng V5-16 (US-177) | 9.5 |
| UXD | `design/content-guide.md` | Sau khi FE áp: đồng bộ mục 8 theo `strings-tables.md`, ghi phiên bản v0.4.7, xóa dòng `fo.tabs.holds`, sửa ô `bk.src_weekend` trong `hifi/09-booking.html` | 1.3, 4.18 |

Phát hiện ngoài phạm vi chữ, chuyển BE và QA (không phải ESC): validator `weekend_nights` (`parameter-rules.ts:180–187`) chỉ nhận số 1–7, trong khi giá trị đang chạy và kiểu `Weekday` dùng mã chữ `["FRI","SAT"]` (`production-defaults.ts:200`, `pricing.ts:12`). Hệ quả:
- lưu lại đúng giá trị đề xuất của từ điển sẽ bị 422, kèm câu "Chọn một trong: 1, 2, 3, 4, 5, 6, 7";
- còn lưu dạng số thì bộ tính giá không còn nhận ra đêm cuối tuần.

Hôm nay INV không cần sửa tham số này (mức tăng = 0, hướng dẫn chuyển giá giữ FRI/SAT), nên chưa gây sai tiền. Nhưng đây là bẫy. Đề xuất: BE đổi validator sang tập `MON…SUN`, và `allowed` trả các mã này. DOM đã chốt cùng hướng (`rules-v1.0.5.md` mục 8.4, BUG-R5-001): sửa bộ kiểm, không đổi bộ tính giá; ARC chốt.

## 7. CPY duyệt (kết quả review 06/11, `rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`)

| # | Khóa | Kết quả CPY | Đã áp ở bản 1.1 |
|---|---|---|---|
| C1 | 7 chuỗi RU ở mục 5.1 | Duyệt có điều kiện (thẻ 01) | Thẻ 01: "Предоплата" ở dòng 4 `sale.quote_text` (5.1) |
| C2 | `gw.lang_auto` (EN, VI, RU) | Duyệt | Thêm `gw.lang_auto_sr` (thẻ 10, 4.6) |
| C3 | `bill.line.early_departure_fee_same_day`, `_notice_one`, `_notice_other` | Duyệt | Thẻ 03: U+00A0 sau `{noticeDays}` (4.1) |
| C4 | `bill.line.late_fee_as_night` | Duyệt | Thẻ 05: VI có ngoặc. Thẻ 04 (bản 1.2): DOM xác nhận ca sửa thẳng, thêm `bill.line.late_fee_after_limit` theo chữ CPY (4.8) |
| C5 | Dấu "!" ở `msg.hot_water_issue` | Duyệt có điều kiện (thẻ 06) | 3 câu của CPY (5.1). Mức nên có, cùng lượt với 4.20 (b), 4.21, thẻ 08 |
| C6 | "phụ thu" ở họ `bill.line.*` | Đồng ý để sau | v1.0.6, gộp 4.20 (c) (backlog R5-B-03). Hướng VI đã có ở mục 2 của tệp review CPY |

Các khóa khách CPY viết thêm trong review: 4.20, 4.21, `gw.req.clean_long_fee` (5.1), `gw.lang_auto_sr` (4.6). Khi áp thì không cần CPY duyệt lại. UXD kiểm khớp nguyên văn khi review PR.

CPY lượt 3 (mục 12 tệp review): thẻ 04 Closed; `stay.charge_penalty_note` (4.3) DUYỆT; 3 câu `sale.hold_next`, `sale.hold_next_ctv`, `sale.hold_next_no_qr` (4.14) DUYỆT CÓ ĐIỀU KIỆN theo thẻ 12. Bản 1.3 áp nguyên chữ CPY của thẻ 12.

Mọi khóa còn lại là chữ Desk nội bộ, UXD tự quyết theo protocol.

## 8. Kiểm sau khi áp (QA, UXD review PR)

- `grep` trên `strings-vi.json` và `strings-en.json`: không còn "28 đêm", "28 nights", "7 đêm", "7+ nights", "+15", "trước giảm theo số đêm", "before length-of-stay", "(R2)", "R2:", "Round 3", "Cả 10 căn", "All 10 rooms".
- `strings-ru.json` và `quote-copy.ts`: không còn "апартамент", "Депозит". `gw.req.clean_long_fee` RU không còn "аренда".
- `quote-copy.ts` VI và `gw.req.clean_makeup_free`, `gw.req.clean_second_fee`: không còn "căn" đứng riêng. Nếu lượt C5 đã áp thì 3 mẫu `msg.*` VI cũng không còn.
- Nếu lượt C5 đã áp: `msg.hot_water_issue`, `msg.house_rules_smoking`, `guest.late.done_title`, `msg.bill` RU không còn "!", trừ lời chào RU "Здравствуйте, {name}!".
- Phiếu VI/EN: `bill.line.early_departure_fee_notice_*` có U+00A0 sau số (soát bằng `tv(key)`, không gõ lại). Ở khung 362 px, số và chữ "ngày"/"days'" không tách dòng.
- `strings-vi.json`, `strings-en.json`: không còn "được nhắc", "get a reminder", không còn khóa `sale.hold_next*_one` / `_other`. Hộp xanh sau khi tạo giữ chỗ hiện đúng giờ hạn của đơn (so với khung đơn), cả khi giữ chỗ bị chặn ở `holdLatestTime`. Đăng nhập vai sale và vai CTV: tạo giữ chỗ, đọc hộp xanh, mở đơn ở "Đơn của tôi" → nút "Gia hạn giữ chỗ (1 lần)" hiện trước hạn, đúng chữ trong câu (so với `drawer.action.extend_hold`).
- Hộp thêm khoản phát sinh (StayDialogs 755): chọn khoản nhóm `penalty`, rồi nhóm `damage`. Câu "Phí phạt và tiền bồi thường hư hỏng…" hiện ở cả hai; khoản minibar, giặt không hiện.
- Phiếu: quản lý sửa đơn giá dòng `late_fee_as_night` 800.000 → 400.000 → nhãn "Phụ thu trả muộn (rời sau mốc trả muộn)"; dòng 800.000 kèm FOC 400.000 → nhãn "Phụ thu trả muộn (bằng giá 1 đêm)".
- Trình đọc màn hình (VoiceOver hoặc NVDA) ở ô chọn ngôn ngữ trang khách: đọc "Language selected for you" khi khách chưa tự chọn.
- Đổi thử tham số trên stack QA: `long_stay_required_from_nights` = 21, `checkout_time` = 11:00, `los_discount` có 1 bậc, `weekend_uplift_pct` = 10. Chữ theo đúng số mới:
  - hộp thuê dài hạn;
  - gợi ý trả muộn;
  - dòng "Đã giảm … theo số đêm ở";
  - các dòng "{n} đêm × giá" của báo giá cộng đúng bằng tổng.
- ParamDialog: thử 6 dạng lỗi `PARAM_OUT_OF_RANGE`, JSON thiếu ngoặc kép, giờ sai dạng. Không còn `{min}`, `{max}` lộ ra; không còn "danh sách" ở ô không có danh sách.
- Đặt phòng mới, kênh OTA để trống giá: không có "0 đ". Trực tiếp gõ dưới sàn: câu có số sàn, trần thật.
- Desk EN ở khung 362 px (PWA) và 1440 px: các cụm U+2011 không gãy dòng.
- Bản 1.4, mục 9.1 (khi 5B-1 lên staging): lễ tân mở đơn đã hủy → nút "Ghi tiền về sau khi hủy" có, sale và CTV không thấy nút. Hộp chỉ có Chuyển khoản, VietQR. Khung cảnh báo đầu hộp luôn hiện. Thiếu ảnh hoặc chọn tiền mặt thì hiện đúng câu 9.1. Ghi xong hiện câu `rsv.after_cancel.done` có số tiền và mã đơn.
- Bản 1.5, mục 9.1 (ca QA (h), (i) của DOM 11.4): yêu cầu hoàn tự tạo hiện "Tiền về sau khi hủy", khối nơi nhận cố định, không có nút Nhập nơi nhận hoàn, không có lối chi tiền mặt. Cùng 400.000 ở đơn cũ và đơn mới, cách 2 giờ: chip "Có thể trùng" ở màn duyệt hoàn và màn đối soát, câu chỉ hiện mã đơn. Gõ lại một mã giao dịch đã ghi: câu `error.DUPLICATE_BANK_REFERENCE` có mã đơn kia, không có khoản thu mới.
- Bản 1.5, mục 9.1a (khi V5-48 lên staging): lễ tân bấm Xác nhận cọc hoặc tạo VietQR trên đơn đã hủy (mở ở tab cũ) → câu 9.1a có "Đã hủy", không phải câu "tải lại". Sale tạo VietQR trên đơn đã hủy → câu `_sales`. Đơn Không đến → "Không đến".
- Bản 1.5, mục 9.4 (khi PR #96 lên staging): `los_discount` có `pct` 120 ở luật thứ hai → "Chỗ cần sửa: mục 2, pct. Giá trị phải từ 0 đến 100. …"; `lease_terms` 13 kỳ → câu cả giá trị có "(12)"; `weekend_uplift_channels` = "web" → "Chọn một trong: all, direct, agent, ota". Không còn `{where}`, `{detail}`, `{key}` lộ ra; chỉ số đếm từ 1.
- Bản 1.5, mục 9.5 (khi PR-B2 lên staging; ca DOM T-16-1…10, ARC T16-6…12): lễ tân bỏ dòng tay của chính mình hôm nay → lưu được. Bỏ dòng của lễ tân khác, dòng phụ thu trả muộn Desk tự ghi, dòng mình ghi hôm qua → câu `error.reduce_needs_foc`, có nút "Gửi miễn có duyệt", folio không đổi. Bấm nút → form miễn phí đúng dòng, Số tiền điền sẵn đúng phần định giảm, chọn được "Ghi nhầm". Quản lý bỏ dòng bất kỳ → lưu được, không có câu phụ. Lễ tân không thấy bộ lọc "Sửa giảm dòng – 7 ngày".
- Bản 1.5, mục 9.3 (khi V5-1A lên staging): căn giá tháng 8.500.000, gõ giá đêm 2.800.000 → câu `rooms.night_high`, nút "Vẫn lưu giá này", lưu được. Gõ 1.700.000 (đúng bằng ÷ 5) → không cảnh báo. Gõ 280.000 (< ÷ 30) → câu `rooms.night_low` mới. Lưu giá đêm qua API với giá tháng ngày hiệu lực khác giá đang hiện → toast có dòng `rooms.warn.nightly_price_unusual`.
- Bản 1.4, mục 9.2 (khi V5-25 lên staging, theo oracle BR-113-06…30): ca 07, 08, 09, 20, 22, 27 → `params.err_min_stay_shape`; ca 11, 12, 16 → `params.err_min_stay_nights` với số đúng; ca 17, 18, 19, 23, 24, 25 → câu chung 9.4 có "Chỗ cần sửa: mục 1, …" và "Chọn một trong: …" (bản 1.5: ca 23 chuyển sang đây theo PR #96); ca 28 → `params.err_short_stay_below_min_stay` với số 2. Không còn `{min}`, `{max}` lộ ra.
