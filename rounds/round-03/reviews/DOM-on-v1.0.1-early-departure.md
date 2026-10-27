# DOM – chốt nghiệp vụ bản vá v1.0.1 (trả phòng sớm B16) và rà chữ UXD

- Người review: DOM | Round 3, Review chéo bản vá v1.0.1 (04/11) | Ngày: 27/10/2026
- Đầu vào: `rounds/round-03/reviews/BE-B-on-BE-A-v1.0.1.md` (câu 1, 3 cho DOM; thẻ 01, 02); `rounds/round-03/outputs/UXD/v1.0.1-early-departure-and-prices.md` (mục 2.5, bảng chuỗi `early_departure.*`); BR-428, BR-403, BR-307, BR-008, BR-011.
- Kết quả: BR **v0.4.8**. Chỉ làm rõ BR-428, **không đổi chính sách**. Oracle thêm `BR-428-07`, `08`, `09`. `node product/tests/tools/validate-fixtures.mjs`: **OK – 0 lỗi, 1 cảnh báo** (cảnh báo này có sẵn trước khi sửa).

## Câu 1 – "Chênh lệch đổi phòng hoàn 100 %" khi bị trần số dư

**Chốt: tính phần được hoàn sau trần. Kèm cặp "đã đảo, không hoàn", giống phụ thu người. Đồng ý đề xuất A của BE-B.**

- BR-428 đã có thứ tự chia: phụ thu người → chênh lệch đổi phòng → phần hoàn BR-428. Phần vượt số dư thì "chỉ đảo dòng, không hoàn". Vậy "hoàn 100 %" là **tỷ lệ hoàn trên phần khách đã trả** (không áp 50 % như tiền phòng). Nó không phải lời hứa hoàn toàn bộ số đã đảo.
- Hiện toàn bộ số đã đảo như một số "hoàn đủ" là sai tiền ở phần giải thích với khách. Ví dụ BE-B: màn hình ghi "hoàn đủ 400.000" ngay trên dòng "Hoàn 100.000".
- Thứ tự chia áp cho **số dư thừa của cả folio**. Tiền khách trả không gắn với từng dòng. Ví dụ tay của BE-B: phụ thu người chưa từng được thu, nhưng vẫn nhận 300.000 trước, vì nó đứng đầu thứ tự. Kết quả này đúng: tổng khách trả là 2.800.000, nợ thật là 2.400.000.
- Ràng buộc cho ARC/BE:
  - Ba phần được hoàn cộng lại bằng `refundVnd`.
  - Mỗi khoản có cặp số: được hoàn + đã đảo không hoàn = số đã đảo của khoản đó.
  - `refundCapped` giữ nguyên giá trị.
  - Audit và yêu cầu hoàn dùng cùng nghĩa.
- Nếu ARC chọn B (không đổi hợp đồng ở 0.3.9), Desk **không được** hiện chữ "hoàn đủ" cạnh `roomChangeDifferenceVnd` (xem thẻ 01). A nên làm ở v1.0.1, vì trường này chưa có client nào dùng.
- Ví dụ đã thêm vào BR-428 và oracle:
  - **BR-428-07 – Trực tiếp**: 4 × 700.000 đã trả 2.800.000; phụ thu 150.000/đêm ghi nhưng chưa thu; báo 21/10, rời 22/10. Số dư 400.000 → hoàn 400.000 = phụ thu 300.000 + phần BR-428 100.000/700.000.
  - **BR-428-08 – Agoda trả trước**: đổi 202 → 401 theo yêu cầu khách. Chênh lệch 250.000 × 3 = 750.000, khách đã thu 300.000; rời 22/10 → đảo 500.000. Số dư 50.000 → **được hoàn 50.000, đã đảo không hoàn 450.000**. `pendingFix` FB-R3-BE-B-BE-A-01.

## Câu 2 – Dòng "Phí trả phòng sớm" của đơn OTA có hiện số ngày báo trước?

**Chốt: không hiện. Đồng ý đề xuất BE-B.**

- Số OTA giữ lại theo chính sách của kênh. Số ngày khách báo OTTIMO không làm số này đổi. Ghi "báo trước N ngày" trên dòng OTA làm khách hiểu nhầm là OTTIMO phạt vì báo muộn. Trường hợp `0 ngày` hiện nay còn là số sai.
- Dòng Trực tiếp/CTV giữ "Phí trả phòng sớm (báo trước N ngày)", N theo BR-011 (= `shownNoticeDays` khi có đêm trực tiếp). Audit `reason` dùng số thật.
- Chỉ áp cho dòng ghi mới. Dòng đã ghi giữ nguyên (BR-008), không cần migration.
- Oracle **BR-428-09** (nhãn VI/EN của 3 dòng), `pendingFix` FB-R3-BE-B-BE-A-02.
- Màn tính thử áp cùng nguyên tắc: xem thẻ 02 bên dưới.

## Rà chữ nghiệp vụ UXD (`early_departure.*`)

### FB-R3-DOM-UXD-ED-01
- Mức độ: Major
- Vị trí: UXD mục 2.5 bảng "Cách tính" dòng 4–6; chuỗi `row_extra_refund`, `row_extra_reversed`, `row_room_change`
- Vấn đề:
  - Nhãn dùng "đã thu … hoàn đủ" và "chưa thu … không hoàn". Nhưng theo câu 1, số được hoàn là kết quả chia số dư theo thứ tự, không phải số "đã thu" của dòng đó. Ở ví dụ BR-428-07, phụ thu chưa từng thu mà vẫn hiện "đã thu – hoàn đủ 300.000".
  - Chênh lệch đổi phòng chưa có dòng "đã đảo, không hoàn".
- Vì sao quan trọng: Lễ tân đọc nguyên văn cho khách. Khách đối chiếu với biên nhận sẽ thấy sai.
- Đề xuất sửa (theo phương án A của BE-B):

  | Khóa | VI | EN | Khi hiện |
  |---|---|---|---|
  | `row_extra_refund` | Phụ thu người của các đêm bỏ – hoàn | Extra-guest charge for the dropped nights – refunded | `extraPersonRefundVnd` > 0 |
  | `row_extra_reversed` | Phụ thu người của các đêm bỏ – chỉ đảo dòng, không hoàn (vượt số khách trả thừa) | Extra-guest charge for the dropped nights – reversed, not refunded (more than the guest overpaid) | `extraPersonReversedVnd` > 0, chữ Stone, không cộng vào tổng |
  | `row_room_change` | Chênh lệch đổi phòng của các đêm bỏ – hoàn | Room change difference for the dropped nights – refunded | `roomChangeDifferenceVnd` (sau trần) > 0 |
  | `row_room_change_reversed` (mới, sau dòng 6) | Chênh lệch đổi phòng của các đêm bỏ – chỉ đảo dòng, không hoàn (vượt số khách trả thừa) | Room change difference for the dropped nights – reversed, not refunded (more than the guest overpaid) | `roomChangeDifferenceReversedVnd` > 0, chữ Stone, không cộng vào tổng |

  - Nếu ARC chọn B, dòng 6 đổi thành "Chênh lệch đổi phòng của các đêm bỏ (đã đảo)" / "Room change difference for the dropped nights (reversed)", không có chữ "hoàn". Khi `refundCapped` thì chỉ hiện tổng `refundVnd` và `refund_capped`.
- Trạng thái: Open

### FB-R3-DOM-UXD-ED-02
- Mức độ: Minor
- Vị trí: mục 2.5 bảng "Cách tính" dòng 2 (`row_notice` "luôn, kể cả đơn chỉ có đêm OTA")
- Vấn đề: Theo câu 2, số ngày báo trước không áp cho phần OTA. Hiện dòng này khi chỉ có đêm OTA thì màn hình nói một đằng, bill nói một nẻo.
- Vì sao quan trọng: Màn hình và bill phải nói cùng một điều. Lễ tân dễ nói nhầm với khách OTA rằng "báo sớm thì được hoàn nhiều hơn".
- Đề xuất sửa: điều kiện hiện của `row_notice` đổi thành "có ít nhất một đêm không OTA (cùng điều kiện dòng 1)".
- Trạng thái: Open

### FB-R3-DOM-UXD-ED-03
- Mức độ: Major
- Vị trí: `early_departure.ota_room_note`
- Vấn đề: Câu "Tiền phòng OTA của các đêm bỏ do OTA hoàn cho khách, không qua OTTIMO" ngầm hứa là OTA sẽ hoàn. Thực tế OTA hoàn hay giữ là theo chính sách của kênh (BR-307, BR-428 "Đơn OTA theo OTA"). Chính lễ tân vừa nhập "số OTA giữ lại" ở dòng 7.
- Vì sao quan trọng: Khách nghe lễ tân nói "OTA sẽ hoàn", rồi đặt giá không hoàn, sẽ khiếu nại OTTIMO.
- Đề xuất sửa:
  - VI: "Tiền phòng OTA của các đêm bỏ: OTA hoàn hay giữ theo chính sách của kênh, không qua OTTIMO."
  - EN: "OTA room charge for the dropped nights: refunded or kept by the OTA under its own policy, not through OTTIMO."
- Trạng thái: Open

### FB-R3-DOM-UXD-ED-04
- Mức độ: Minor
- Vị trí: `early_departure.refund_capped`, `refund_capped_zero`
- Vấn đề:
  - "Khách chưa trả đủ phần này" không rõ "phần này" là phần nào. Thực chất là khách chưa trả đủ tiền của cả lượt ở (số dư cả folio).
  - "Trừ vào số khách còn phải trả" đúng nghĩa, nhưng nên nói rõ là không trả ra bằng tiền.
- Vì sao quan trọng: Đây là câu lễ tân dùng để giải thích vì sao hoàn ít hơn bảng tính.
- Đề xuất sửa:
  - `refund_capped`
    - VI: "Khách chưa trả đủ tiền của lượt ở, nên chỉ hoàn {amount} (số khách đã trả thừa). Phần còn lại chỉ làm giảm số khách đang nợ, không trả ra bằng tiền."
    - EN: "The guest hasn't paid for the whole stay, so only {amount} (the overpayment) is refunded. The rest only reduces what the guest owes; it isn't paid out."
  - `refund_capped_zero`
    - VI: "Khách chưa trả thừa nên không có khoản hoàn. Phần hoàn chỉ làm giảm số khách đang nợ."
    - EN: "The guest hasn't overpaid, so there is no refund. The amount only reduces what the guest owes."
- Trạng thái: Open

### FB-R3-DOM-UXD-ED-05
- Mức độ: Minor
- Vị trí: `early_departure.effect_door` (UXD G3, "DOM xác nhận câu này")
- Vấn đề:
  - **Xác nhận** đúng thực tế v1.0–v1.0.1: mã cửa tạo và giao tay trên app khóa (TTLock), OTTIMO không giữ mã.
  - Nhưng ngày đi mới thường là **hôm nay**. Khi đó việc đúng là xóa mã lúc khách trả phòng (BR-403 "luôn thu hồi ngay khi trả phòng"), không phải "rút ngắn tới ngày đi mới". Câu hiện tại cũng không nói rút tới **giờ** nào.
- Vì sao quan trọng: Mã cửa còn hiệu lực sau khi khách đi là rủi ro an toàn cho căn đã mở bán lại.
- Đề xuất sửa:
  - VI: "Trên app khóa: rút hiệu lực mã cửa về giờ trả phòng ngày {date}; khi khách trả phòng thì xóa mã."
  - EN: "In the lock app: cut the door code's validity to check-out time on {date}; delete the code when the guest checks out."
- Trạng thái: Open

### FB-R3-DOM-UXD-ED-06
- Mức độ: Minor
- Vị trí: khối hậu quả, `effect_nights`
- Vấn đề: "Căn {room} mở bán lại" chỉ đúng trên Desk. Ở v1.0.x chưa có kết nối kênh (Beds24 ở v1.1), nên các đêm mở lại **không tự mở trên extranet OTA**.
- Vì sao quan trọng: Không mở lại trên kênh thì bán lỡ đúng những đêm vừa trống. Đây là điểm được của trả sớm với OTTIMO.
- Đề xuất sửa: thêm dòng hậu quả `effect_ota_reopen` (luôn hiện tới v1.1):
  - VI: "Mở lại các đêm này trên extranet OTA (Desk chưa tự mở)."
  - EN: "Reopen these nights on the OTA extranets (Desk doesn't do this yet)."
- Trạng thái: Open

### FB-R3-DOM-UXD-ED-07
- Mức độ: Suggestion
- Vị trí: `early_departure.no_refund_notice`
- Vấn đề: Câu có mã "(BR-428)". Lễ tân không biết mã BR, còn khách hỏi thì cần một câu nói được thành lời.
- Đề xuất sửa:
  - VI: "Không hoàn: khách báo chưa đủ số ngày trước theo chính sách trả sớm."
  - EN: "No refund: the guest didn't give enough notice under the early departure policy."
- Trạng thái: Open

**Các chuỗi còn lại: đạt, giữ nguyên.** Gồm `row_base`, `row_refundable`, `row_ota_retained`, `row_refund`, `row_refund_help`, `row_fee`, `effect_fee`, `effect_departure`, `effect_registration`, `effect_child_*`, `told_guest`, `amount_changed`. Riêng `row_refundable` vẫn hiện số theo chính sách (trước trần) khi `refundCapped`. Như vậy là đúng, vì `refund_capped` giải thích phần chênh.

## File đã sửa

- `product/docs/business-rules.md`:
  - BR-428 thêm đoạn (v0.4.8) về nghĩa "hoàn 100 %" khi bị trần, và nhãn dòng phí OTA;
  - thêm 2 ví dụ trần số dư;
  - đầu file lên 0.4.8;
  - mục 18 thêm v0.4.8.
- `product/tests/fixtures/br-examples.json`: thêm `BR-428-07`, `BR-428-08` (pendingFix FB-R3-BE-B-BE-A-01), `BR-428-09` (pendingFix FB-R3-BE-B-BE-A-02); `source.version` 0.4.8; ghi chú `owner`.
- Không commit.
