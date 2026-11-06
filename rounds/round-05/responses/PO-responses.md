# PO – Phản hồi review Round 5

- Người trả lời: PO · 06/11/2026 tối · Bước: Phản hồi & sửa.
- Nguồn thẻ: `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 3 (tờ dán quầy `product/docs/staff-one-pager.md`, commit `8d607f98`). Trạng thái cũng ghi ngay dưới từng thẻ trong tệp review.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-SEC-PO-01 | Fixed | Tờ 1, khối "Check-in online", dòng "Gửi nhầm người": thu hồi link, tạo link mới; ghi sổ giao ca mã đơn, giờ gửi, giờ thu hồi, kênh (không ghi tên khách, không ghi tên hay số người nhận nhầm); **báo chủ đầu tư trong ngày**; đơn đã hiện **Đã làm thủ tục trước** mà khách nói chưa gửi thì không dùng giấy tờ đó, báo chủ đầu tư ngay. Lệnh dừng của chủ đầu tư tách gạch riêng. PO bỏ giả định "không báo" theo quyết định SEC. Chờ SEC đọc lại một dòng này rồi INV in Tờ 1 |
| FB-R5-SEC-PO-02 | Fixed | Tờ 1 gạch 2: gửi riêng 1–1 tới số, email hoặc hội thoại OTA **ghi trên đơn**; người xin link từ số khác thì không gửi. Sửa cùng lần với PO-01 |
| FB-R5-SEC-PO-03 | Fixed | Chú thích đầu Tờ 2a bỏ vế "Điều kiện bỏ khối check-in…" |
| SEC mục 5 ý 1 (runbook SR-INC-01) | Accepted | PO xếp **V5-74**, Gói 6, bắt buộc, SEC viết (OPS góp phần kỹ thuật), OPS và DOM review. Hạn 14/11, review 15–16/11 (plan R5 mục 2 Gói 6, mục 6 quyết định 11). Tới khi có, sổ vận hành dùng lớp tạm của FB-R5-SEC-BA-04 |

Tờ 2a: SEC cho in. Phần giữ chỗ chờ DOM đọc; thẻ DOM (nếu có) trả lời ở tệp này khi ORC chuyển tới.

## Review CPY chữ v1.0.5 (`rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`) – PO chốt phạm vi

Các thẻ dưới gửi UXD. PO chỉ chốt phạm vi (plan R5 mục 6, quyết định 15). UXD sửa rồi đổi trạng thái thẻ thành Fixed.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-CPY-UXD-V105-02 (a) | Accepted – v1.0.5, bắt buộc | V5-23. `sale.quote_text` VI dòng 2, `gw.req.clean_makeup_free`, `gw.req.clean_second_fee`: "căn" → "phòng" theo chữ CPY, cùng lượt sinh lại `quote-copy.ts`. BA sửa sổ tay nếu có trích báo giá mẫu (V5-71) |
| FB-R5-CPY-UXD-V105-02 (b) | Accepted – v1.0.5 cùng lượt C5, nên có | V5-23. `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue` dùng "phòng {room}". Không chặn QC; không kịp thì chuyển US-125 (B-SAU) |
| FB-R5-CPY-UXD-V105-02 (c) | Deferred – v1.0.6 | Backlog R5-B-03 (B-QUAY), gộp với C6: dòng phiếu `bill.line.*` và khóa chưa dùng `guest.stay.room`, `guest.late.how_1`, `gw.room` |
| FB-R5-CPY-UXD-V105-06 | Accepted – v1.0.5 cùng lượt C5 | Điều kiện của C5: áp đúng 3 câu EN, VI, RU của CPY. Vì phần (b) thẻ 02 đã nhận, bản VI dùng "phòng {room}" |
| FB-R5-CPY-UXD-V105-07 | Accepted – v1.0.5 cùng lượt C5, nên có | `msg.house_rules_smoking` (3 ngôn ngữ), `msg.bill` RU, `guest.late.done_title` EN/VI theo chữ CPY. RU vào danh sách người bản xứ (CPY mục 3). Không chặn QC; không kịp thì US-125 |
| FB-R5-CPY-UXD-V105-08 | Accepted – v1.0.5 cùng lượt C5 (hoặc C1), nên có | `msg.booking_confirmed` RU: "Предоплата {deposit} получена, остаток {balance} — при заселении." Vào danh sách người bản xứ |
| CPY C6 (ý kiến ngắn) | Deferred – v1.0.6 | Backlog R5-B-03: đổi cả họ `bill.line.*` VI một lượt ("phụ thu" → "phí"), `sale.quote_text_extra_guest_*` (CPY sửa), BA sửa sổ tay cùng lúc. Chữ Desk nội bộ giữ |
| CPY mục 5 – BR-012 thứ tự tên, số phòng | Deferred – B-SAU | Backlog R5-B-04, cùng US-125. PO + ARC xem cách ghép ở `quotes.service.ts` |
| CPY mục 5 – `msg.checkout_reminder` | Đã có quyết định | B-SAU với `{checkout_time}` (plan R5 quyết định 14) |
