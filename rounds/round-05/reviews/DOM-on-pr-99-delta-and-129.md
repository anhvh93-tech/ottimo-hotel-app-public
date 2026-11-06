# DOM review – PR #99 phần chênh sau review trước, và PR #129 (K13 đếm hoa hồng)

- Người review: DOM | Round 5 – bước Review (nghiệp vụ) | Ngày: 07/11/2026
- Đối tượng:
  - **PR #99** (BE-A2, V5-15), nhánh `r5-a1b` @ `92d16358`. Phần chênh so với lần DOM review @ `ba99bdb8` (`DOM-on-be-prs-106-99-checkout.md`) nằm ở hai commit:
    - `6d8456a5`: mốc hoa hồng;
    - `9bbd15e9`: giờ rời của mọi B18, cửa sổ đếm minibar, `Retry-After`.

    Các commit còn lại trên nhánh là gộp `main`.
  - **PR #129** (OPS, runbook v1.0.5 r3), nhánh `r5-ops-runbook-r3` @ `56ee7fc9`. Head hiện là `3861ccc4`; commit này chỉ sửa một dòng ở `OPS-responses.md` (FB-R5-SEC-OPS-V525-02 ý 1), không chạm K13. DOM đọc K13 và giả định (c) ở runbook mục 8.
- Đối chiếu:
  - BR-006, BR-212, BR-304, BR-422, BR-525, BR-527, BR-903 (H2 v0.5.12);
  - `rules-v1.0.5.md` 4.2 (cơ sở hoa hồng ngắn ngày), 15.5 (mốc hoa hồng);
  - `DOM-on-be-prs-101-108-110.md` 1.2 ý 2; ESC-051 câu 1.
- Mã `main` @ `543e0455`:
  - `folio.service.ts`: `settle`, `tryEarnCommissions`, `syncCommission`, `payeeTypeOf`;
  - `commission-rate.ts`, `quote-pricing.ts` (tỷ lệ chụp lúc báo giá), `reservations.service.ts` (đơn lấy tỷ lệ của báo giá);
  - schema `commission` (trạng thái `projected`, `earned`, `payable`, `paid`, `void`; dòng thuê tháng có `lease_contract_id`).
- Không ghi tỷ lệ, số tiền hoa hồng hay mã đơn. Không chép số đếm của lượt chạy thử OPS.

## 1. Kết luận

- **PR #99 @ `92d16358`: ĐẠT về nghiệp vụ.** Điều kiện của lần trước đã xong.
  - FB-R5-DOM-BE-PR99-01 (Major): **Closed**.
  - FB-R5-DOM-BE-PR99-02 (Minor): **Closed**.
  - FB-R5-DOM-BE-PR99-03 (Suggestion, v1.0.6): còn Open, không chặn.
  - Phần chênh không có thẻ mới.
- **PR #129 @ `56ee7fc9` (head `3861ccc4`): ĐẠT CÓ ĐIỀU KIỆN về nghiệp vụ**, chỉ riêng K13. Phần còn lại của runbook không thuộc DOM review lần này.
  - Giả định (c) **đúng một nửa.**
    - Đúng: chỉ đếm đơn ngắn ngày; người chốt là sale hoặc CTV; không đếm đơn dài hạn, không đếm đơn lễ tân chốt.
    - Chưa đúng: cách xác định "đơn mang tỷ lệ cũ". Đếm theo ngày tạo đơn và vai người chốt bỏ sót một số đơn và đếm thừa một số đơn khác.
    - Thẻ **FB-R5-DOM-OPS-129-01** (Major). OPS sửa câu trước khi SEC ghim.
  - Cách đọc dòng hủy hoặc không đến ("không có hoa hồng để chi") sai BR-903 (2). Thẻ **FB-R5-DOM-OPS-129-02** (Minor).
  - Giả định (a) và (b) là việc SEC chốt. Góc nghiệp vụ DOM đồng ý (a): hàng chủ đầu tư nhập ngay trên v1.0.4 cũng tính là đã nhập, đúng DOM 1.2 ý 1.

## 2. PR #99 – ba điểm ORC hỏi

| Điểm | DOM | Lý do (đã đọc mã) |
|---|---|---|
| Mốc hoa hồng = `folio.settled_at`: khoản `pending` hoặc `disputed` tạo **sau** lúc chốt folio thì giữ hoa hồng | **Đúng luật 15.5, Closed PR99-01** | `settle()` là chỗ duy nhất ghi `settled_at`. Nó chỉ chạy khi folio `open`, và không đường nào mở lại folio, nên mốc ghi một lần và không đổi. B18 gọi `settle` trước `tryEarn` trong cùng giao dịch. Khoản `finalPayment` ghi trong chính lệnh B18 không "sau" mốc, nên không giữ hoa hồng. Test có đủ 5 ca: ca 1 của DOM (VietQR 12:00, xác nhận 12:01, B18 12:03, đạt 12:03); `finalPayment` chuyển khoản; đơn quá ngày đi (khoản 15:00 hôm trước, B18 09:00 hôm sau, đạt lúc B18); ca ARC 2 (thu nợ sau B18 chờ đối soát); ca ARC 4 (khoản người hưởng tự ghi còn chờ thì vẫn giữ, bất kể lúc nào) |
| B18 ghi `actual_checkout_at` = giờ khai (giờ khách rời thật), không phải giờ bấm, **cho mọi B18** | **Đúng luật 15.1, Closed PR99-02** | Mã dùng `departedAt = d.checkout.at`. `readInput` bắt buộc có `checkoutTime` hoặc `checkoutAt`, nên giờ này luôn là giờ người ghi khai, đã qua kiểm dung sai và ghi chú. Phí trả muộn, đơn, đăng ký lưu trú (`stay_ended_at`) và hồ sơ khách giờ dùng **một** giờ rời. Lúc bấm (`ctx.now`) vẫn dùng cho audit, chuyển trạng thái, `post_checkout_window_until`, `debt_opened_at` và `folio.settled_at`, đúng như DOM xác nhận ở giả định 2 lần trước. Test: chỉ gửi `checkoutTime`, giờ gõ sớm hơn lúc bấm 40 phút, có ghi chú → `actual_checkout_at` và đăng ký lưu trú = giờ gõ |
| Cửa sổ đếm minibar dùng **ngày đi của cả lượt ở** (BR-422, kể cả gia hạn) | **Đúng** | `stayDepartureDateOf` lấy ngày đi muộn nhất của đơn chính và các đơn con gia hạn còn hiệu lực. Với lượt đang ở thì đó là các đơn con `in_house`, cùng tập đơn mà B16/B18 dùng (`effectiveStay`). Vì vậy "quá ngày đi" và "đếm từ ngày nào" cùng một mốc. Cửa sổ chỉ mở khi lượt đã quá ngày đi; đường thường giữ K11-09 ("đếm hôm nay"). Chặn B18, danh sách tủ chưa đếm của tóm tắt và `latestCheck` của màn minibar dùng chung `countInWindow`, nên quầy không còn thấy "đã đếm" ở chỗ này mà "chưa đếm" ở chỗ kia. Đọc qua đơn con thì lấy ngày đi của đơn chính, vì tủ thuộc đơn chính. Test: đơn OTA gia hạn bằng đơn con, cửa sổ bắt đầu từ ngày đi của **đơn con**, lần đếm vào ngày đi cũ không còn được tính. Đúng thực tế: khách gia hạn còn dùng tủ những đêm sau |

Ghi chú (không phải thẻ):

- **Phát sinh sau trả phòng:** khách trả bằng VietQR trong 24 giờ sau B18 mà khoản còn chờ đối soát thì giữ hoa hồng tới khi đối soát. Đúng luật DOM 18/10, vì đây là tiền về sau trả phòng.
- **Đơn con gia hạn `confirmed`** (chưa vào ở) của lượt đang ở không kéo dài cửa sổ. Hai lối đọc vẫn khớp nhau, vì B18 coi lượt đó là đã quá ngày đi.
- **PR99-03** (lần đếm cuối có thể trước giờ khách rời) vẫn Open, dời v1.0.6, như đã ghi.

## 3. PR #129 – K13, định nghĩa đếm đơn

### 3.1 Luật nghiệp vụ dùng để đếm

- Hoa hồng ngắn ngày dùng **tỷ lệ chụp lúc báo giá hoặc lúc tạo đơn** (BR-006, BR-903 (5)).
  - Mã lấy tỷ lệ theo `today` lúc báo giá (`quote-pricing.ts`).
  - Đơn tạo từ báo giá mang **tỷ lệ của báo giá** (`snap.quote.commissionRatePct`). Báo giá có hiệu lực 3 ngày (BR-304).
  - `syncCommission` chỉ lấy tỷ lệ hôm nay khi đơn **không** có tỷ lệ chụp.
- Vậy "đơn mang tỷ lệ cũ" là đơn có **ngày chụp tỷ lệ** (ngày báo giá nếu đơn tạo từ báo giá, nếu không thì ngày tạo đơn) rơi vào đoạn từ 01/11 tới trước lúc hàng mới bắt đầu áp.
  - Đơn tạo từ báo giá lập trước 01/11 giữ tỷ lệ cũ là **đúng** BR-006 (báo giá đã chụp tỷ lệ lúc đó). Không đếm, không chỉnh.
- Cái chủ đầu tư phải chỉnh lúc chi là **dòng hoa hồng sẽ chi**, tức dòng `commission` của đơn ngắn ngày chưa `void`. Đơn có người chốt mà không có dòng hoa hồng (người chốt không còn là sale/CTV, tài khoản đã khóa, tỷ lệ 0) thì không có gì để chỉnh.

### 3.2 Câu (2) của OPS lệch luật ở bốn chỗ

1. **Mốc trên là ngày tạo đơn < ngày hiệu lực của hàng mới.**
   - Bỏ sót đơn tạo **sau** mốc từ báo giá lập **trước** mốc. Các đơn này vẫn mang tỷ lệ cũ, trong tối đa 3 ngày (BR-304).
   - Bỏ sót đơn tạo trong chính ngày hiệu lực nhưng **trước lúc** chủ đầu tư lưu hàng mới, khi ngày hiệu lực là hôm nay.
2. **Mốc dưới là ngày tạo đơn ≥ 01/11.** Đếm thừa đơn tạo từ báo giá trước 01/11. Các đơn này giữ tỷ lệ cũ đúng luật.
3. **Đếm theo vai người chốt, không theo dòng hoa hồng.** Câu thiếu điều kiện `app_user.status = 'active'` mà `syncCommission` có, và đếm cả đơn không có dòng hoa hồng (tỷ lệ 0, đã void). Câu cũng không loại đơn con gia hạn, nên một lượt có thể bị đếm hai lần nếu đơn con mang người chốt.
4. **Dòng hủy/không đến được đọc là "không có hoa hồng để chi".** Xem thẻ 129-02.

Số đếm sai hướng nào cũng có hại cho người chi:

- **Thiếu** thì sale hay CTV bị trả sai tỷ lệ mà không ai thấy.
- **Thừa** thì chủ đầu tư mở từng đơn để rồi thấy không cần chỉnh, và lần sau thôi tin con số.

## 4. Thẻ

### FB-R5-DOM-OPS-129-01

- **Mức độ:** Major. Sai định nghĩa của một lớp chặn tiền. K13 là chỗ duy nhất báo chủ đầu tư có bao nhiêu đơn phải chỉnh trước kỳ chi 01/12. Sửa trước khi SEC ghim; không chặn Release.
- **Vị trí:** `rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md`:
  - K13, câu `v530-check` phần (2) (CTE `b`);
  - mục **Cách đọc**, gạch `closer_bookings_old_rate`;
  - mục 8, giả định (c).
- **Vấn đề:** mục 3.2 ý 1–3 ở trên.
- **Đề xuất sửa (định nghĩa DOM, OPS viết câu, SEC chọn cách đọc giá trị):**
  - **Dòng `closer_bookings_old_rate`:** số **đơn chính** ngắn ngày (`parent_reservation_id IS NULL`) có ít nhất một dòng `commission` của đơn (`reservation_id` có, `lease_contract_id` trống) **chưa `void`**, và có ngày chụp tỷ lệ trong đoạn cần chỉnh. DOM để SEC chọn một trong hai cách xác định "đoạn cần chỉnh":
    - **Cách 1 (DOM chọn, đúng nhất):** so tỷ lệ trên dòng hoa hồng (`rate_pct_snapshot`) với tỷ lệ của **đúng loại người hưởng** (`payee_type` staff hay agent) trong hàng mới, **ngay trong câu**. Câu chỉ in số đếm, không in giá trị. Chưa có hàng mới thì mọi dòng như vậy đều tính. Thêm điều kiện ngày chụp tỷ lệ ≥ 01/11 (ngày tạo báo giá qua `quote_id`, nếu không có thì ngày tạo đơn). Cách này đúng cả khi chủ đầu tư giữ nguyên tỷ lệ cho một loại người hưởng: các đơn đó không phải chỉnh, nên không bị đếm.
    - **Cách 2 (khi SEC không cho câu đọc `value`):** đoạn = ngày chụp tỷ lệ từ 01/11 tới **hết** ngày hiệu lực của hàng mới. Lấy cả ngày hiệu lực, vì báo giá trong ngày đó trước lúc lưu hàng mới vẫn ra tỷ lệ cũ. Cộng thêm đơn tạo sau mốc từ báo giá lập trước mốc. Cách này đếm thừa một ít (đơn tạo trong ngày hiệu lực sau lúc lưu); chủ đầu tư xem tay. Thừa còn hơn thiếu.
  - Bỏ điều kiện vai người chốt ở dòng này. Dòng hoa hồng chưa `void` đã là kết quả của luật người hưởng (`payeeTypeOf`, tài khoản đang hoạt động).
  - **Giả định (c), chữ thay:**
    > "Đơn mang tỷ lệ cũ" = đơn chính ngắn ngày có dòng hoa hồng chưa void, mà tỷ lệ được chụp (lúc báo giá, hoặc lúc tạo đơn nếu không qua báo giá) từ 01/11 tới trước khi hàng mới áp. Đơn từ báo giá lập trước 01/11 giữ tỷ lệ cũ đúng BR-006, không đếm. Đơn dài hạn dùng `long_stay_commission` (PR-M), không đếm.
  - **Cách đọc**, gạch `closer_bookings_old_rate` = n > 0, thay câu đầu bằng:
    > Có n đơn ngắn ngày có hoa hồng sale/CTV còn mang tỷ lệ cũ. Chủ đầu tư chỉnh ở kỳ chi mà hoa hồng của đơn tới hạn: 01/12 cho đơn đã đạt trong tháng 11, kỳ sau cho đơn còn dự kiến (BR-212). Chỉnh theo bảng nội bộ, ngoài Desk, có ghi chú lý do.

    Nếu dễ, OPS tách thêm hai số theo trạng thái dòng hoa hồng: đã đạt (`earned`, `payable`, `paid`) và còn dự kiến (`projected`). Chủ đầu tư biết ngay phần nào chi ở 01/12.
  - Lần chạy 1 (lúc Release) không thấy đơn giữ chỗ chưa có dòng hoa hồng; lần chạy 2 (trước 01/12) thấy các đơn đã xác nhận. Đủ cho kỳ 01/12.
- **Trạng thái:** Open (OPS sửa câu → SEC ghim).

### FB-R5-DOM-OPS-129-02

- **Mức độ:** Minor. Chỉ là chữ của **Cách đọc**, nhưng câu hiện nay khiến chủ đầu tư bỏ qua một khoản phải chi.
- **Vị trí:** K13, **Cách đọc**, gạch "`m` trong số đó nay đã hủy hoặc không đến, nên không có hoa hồng để chi"; chú thích SQL phần (2) "(nothing to pay)".
- **Vấn đề:**
  - Theo BR-903 (2) và `rules-v1.0.5.md` 4.2 ý 2 (ESC-051 câu 1, tới khi trả lời áp phương án A), đơn hủy hay không đến mà OTTIMO **giữ tiền** vẫn có hoa hồng: cơ sở là số giữ lại (dòng `cancellation_fee`, `no_show_fee`).
  - Trên `main` @ `543e0455`, `syncCommission` chưa tính phần này. Đơn hủy không có dòng hoa hồng, nên Desk không tự chi.
  - Viết "không có hoa hồng để chi" thì khoản này mất hẳn.
- **Đề xuất sửa:**
  - **Dòng `closer_bookings_cancelled_or_no_show`:** số đơn chính ngắn ngày, người chốt là sale/CTV theo đúng luật `syncCommission` (vai đang có tại cơ sở, tài khoản đang hoạt động), ngày chụp tỷ lệ ≥ 01/11, nay `cancelled` hoặc `no_show`, **có dòng phí giữ lại còn sống** (`cancellation_fee`, `no_show_fee`). Đơn hủy không giữ đồng nào thì không đếm. Dòng này không cần mốc trên, vì hệ thống không chi cho các đơn này ở tỷ lệ nào. Chỉ in số.
  - **Cách đọc**, thay gạch `m` bằng:
    > m đơn ngắn ngày do sale/CTV chốt, từ 01/11, đã hủy hoặc không đến mà OTTIMO giữ tiền. Desk chưa tính hoa hồng cho các đơn này. Theo BR-903 (2), chủ đầu tư tính tay trên số tiền giữ lại theo bảng nội bộ, ở kỳ chi sau khi tiền giữ lại đã đối soát, có ghi chú lý do. Khi ESC-051 câu 1 có trả lời khác A thì làm theo câu trả lời.
  - Nếu phần H2 tính hoa hồng trên số giữ lại vào v1.0.5, các đơn này có dòng hoa hồng và đã nằm ở dòng `closer_bookings_old_rate`. Khi đó OPS bỏ dòng này (ORC báo).
  - `m ≤ n` ở bảng **Đúng là** không còn đúng, vì hai dòng giờ là hai tập khác nhau. Bỏ điều kiện đó.
- **Trạng thái:** Open (OPS).

## 5. Giả định

1. Không có đường nào đưa folio `settled` về `open`. DOM tìm trong `folio` module trên nhánh và không thấy. Nếu sau này có "hủy trả phòng", ARC phải giữ `settled_at` của lần chốt đầu cho mốc hoa hồng, hoặc DOM xem lại.
2. Đơn tạo từ báo giá lấy tỷ lệ của báo giá (`reservations.service.ts` đọc `snap.quote.commissionRatePct`). Nếu form đặt phòng không qua báo giá tự chụp tỷ lệ theo ngày tạo đơn, định nghĩa ở thẻ 129-01 vẫn đúng.
3. `long_stay_commission` (PR-M) là khóa mới, chưa có hàng cũ trên production, nên đơn dài hạn không có vấn đề "tỷ lệ cũ" như ngắn ngày. Thiếu tỷ lệ thì Desk báo thiếu. Nếu ARC cho biết khác, K13 thêm dòng cho dài hạn.
4. Bảng nội bộ 01/11 dùng một mức cho người bán, nhân viên hay CTV (BR-903), nhưng câu vẫn so theo từng loại người hưởng cho đúng cấu trúc hai khóa con.
5. Không ESC mới. Đây là định nghĩa đếm theo BR-006 và BR-903 đã có; ESC-051 câu 1 vẫn chờ chủ đầu tư như cũ.

## 6. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – PR #99 phần chênh và PR #129 K13** (rounds/round-05/reviews/DOM-on-pr-99-delta-and-129.md): #99 @ 92d16358 ĐẠT nghiệp vụ – mốc hoa hồng folio.settled_at (ghi một lần ở settle, trước tryEarn; finalPayment và VietQR lúc trả phòng đạt lúc B18, thu nợ và khoản người hưởng tự ghi còn chờ thì giữ), actual_checkout_at = giờ khai cho mọi B18, cửa sổ đếm minibar theo ngày đi cả lượt (BR-422, gồm đơn con gia hạn) dùng chung cho chặn B18 và màn minibar; PR99-01, PR99-02 Closed, PR99-03 v1.0.6. #129 @ 56ee7fc9 (head 3861ccc4) ĐẠT CÓ ĐIỀU KIỆN cho K13: FB-R5-DOM-OPS-129-01 Major – "đơn mang tỷ lệ cũ" = đơn chính ngắn ngày có dòng hoa hồng chưa void mà tỷ lệ chụp (lúc báo giá, không thì lúc tạo đơn) từ 01/11 tới trước khi hàng mới áp, ưu tiên so tỷ lệ trong câu không in giá trị (SEC chọn), không đếm theo ngày tạo đơn và vai người chốt; FB-R5-DOM-OPS-129-02 Minor – đơn hủy/không đến mà OTTIMO giữ tiền vẫn có hoa hồng trên số giữ lại (BR-903 (2), ESC-051 câu 1 A), Desk chưa tính nên chủ đầu tư tính tay, không phải "không có gì để chi". OPS sửa câu trước khi SEC ghim; không chặn Release | DOM | Quyền DOM (đúng nghiệp vụ); không ESC, không ghi số hoa hồng hay mã đơn |`
