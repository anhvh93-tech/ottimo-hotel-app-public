# DOM – phán thẻ ARC FB-R5-ARC-FE-169-03 (FE-A2 PR #169, Tổng cộng ở bước Bill) và câu cho thẻ 169-02

- Round 5 (v1.0.5) · Bước: Review · DOM · 07/11/2026
- Đọc: `ARC-on-fe-a2-pr-169.md` (thẻ 169-03, 169-04), `DOM-on-fe-a2-pr-169.md` (thẻ 169-01, 169-02), BR-107, BR-110, BR-416, S4-38; decision-log 06/11 dòng "INV – bật giá web với bảng tham số đang chạy"; `product/docs/tham-so-quy-tac.md` mục "Tham số trên production lệch sổ tay"; plan R5 mục G.
- Không có dữ liệu khách thật, không có số hoa hồng.

## 0. Phán

**Chấp nhận cho v1.0.5, không chặn #169.** Kèm ba điều kiện ở mục 3. Thẻ 169-03 của ARC giữ **Minor, v1.0.6**, gộp với DOM 169-01. Không ESC.

## 1. DOM sửa một giả định của chính mình

Review #169 của DOM (mục 1 và 6) và ARC (mục 1) cùng dựa vào "`los_discount = []` từ 01/11". **Giả định này sai với production hôm nay.**
- Decision-log 06/11: INV bật giá web với bảng tham số đang chạy, trong đó **giảm theo số đêm 10 % từ 7 đêm, 15 % từ 14 đêm** còn nguyên.
- Từ điển tham số, mục lệch sổ tay (đối chiếu 06/11): `los_discount` "còn giảm theo số đêm", việc B3 chưa làm. Plan R5 mục G: việc của INV, đội không đổi tham số giá trên production.
- BR-107 v0.5.0 nói "từ ngày chuyển" `los_discount = []`. Ngày chuyển đó chưa tới.

Hệ quả cho bước Bill: chênh "Tổng cộng" vì bậc giảm **không còn nhỏ** như DOM đã viết, khi đêm thêm B18 làm đơn lên bậc. Máy chủ tính lại bậc cho **mọi** đêm (BR-107 S4-38); Desk cộng các dòng đã ghi với giá ở ô (trước bậc).

| Ca (Studio 800.000, 2 người) | Desk "Tổng cộng" | Máy chủ ghi | Chênh |
|---|---|---|---|
| Đơn 6 đêm, trả sau mốc cuối → đêm thứ 7 | 6 × 800.000 + 800.000 = **5.600.000** | 7 × 720.000 = **5.040.000** | Desk cao hơn 560.000 |
| Đơn 8 đêm (đã −10 %), đêm thêm thứ 9 | 8 × 720.000 + 800.000 = 6.560.000 | 9 × 720.000 = 6.480.000 | Desk cao hơn 80.000 |
| Đơn 13 đêm (−10 %), đêm thêm thứ 14 | 13 × 720.000 + 800.000 = 10.160.000 | 14 × 680.000 = 9.520.000 | Desk cao hơn 640.000 |
| Thẻ ARC 169-03: Studio 3 người, có đêm thêm | thiếu phụ thu người đêm thêm | + 150.000 | Desk thấp hơn 150.000 |

## 2. Vì sao vẫn chấp nhận cho v1.0.5

- **Không thu sai đồng nào.** Số thu ("Còn phải thu"), trần QR, trần `finalPayment` và phiếu in đều là số máy chủ, đã gồm bậc, mã khách quay lại, phụ thu người và phần bù FOC. Lỗi chỉ ở một con số xem trước trên màn.
- **Trước #169 còn tệ hơn.** v1.0.4 "Tổng cộng" bỏ cả đêm thêm lẫn phụ thu sắp ghi (BUG-R4-052): mọi đơn có đêm thêm đều hiện thấp hơn cả một đêm. #169 sửa đúng cho ca thường (đêm thêm không đổi bậc, không vượt định mức). Chặn #169 là giữ lỗi lớn hơn.
- **Ca còn lệch hẹp.** Cần đêm thêm B18 (khách ở quá mốc cuối, hiếm ở OTTIMO) **và** một trong: đơn ≥ 6 đêm khi còn bậc giảm; khách vượt định mức; mã khách quay lại; FOC theo đêm.
- **Sửa đúng gốc cần hợp đồng mới** (`CheckoutSummary.extraNightPreview` + `projectedTotalVnd`, 0.3.14, ARC 169-03). Desk tự tính bậc thì trái S4-38 ("client không tự cộng chênh"). Không làm kịp và đúng trong v1.0.5.
- Khi INV làm B3 (`los_discount = []`), ba dòng đầu của bảng mục 1 hết. Còn ca phụ thu người (150.000/người) và ca mã khách quay lại.

## 3. Điều kiện

1. **Sổ tay** (thẻ DOM 169-02, BA): thay câu đề xuất cũ bằng câu ở mục 4, trước khi phát sổ tay v1.0.5.
2. **Release notes v1.0.5, "Giới hạn đã biết"** (PO): một dòng: "Trả phòng có đêm thêm: Tổng cộng ở bước Bill có thể lệch số thu khi đơn đổi bậc giảm theo số đêm hoặc khách vượt định mức. Thu theo Còn phải thu; phiếu in là số đúng. Sửa ở v1.0.6."
3. **Thẻ 169-01 và 169-03 làm ở v1.0.6, không phụ thuộc INV.** DOM bỏ điều kiện cũ "phải xong trước khi INV bật lại `los_discount`": bậc giảm đang bật. Nếu tới lúc cắt v1.0.6 INV đã làm B3, mức ưu tiên vẫn giữ vì còn ca phụ thu người.

Ghi chú cho ORC (không ESC, việc B3 đã nằm trong danh sách của INV): khi trình tổng kết round, nhắc INV rằng còn bậc giảm theo số đêm trên production thì màn Bill có chênh như mục 1, và B3 xong thì phần lớn chênh hết.

## 4. Câu cho BA – ghi vào thẻ 169-02 (thay đề xuất cũ)

Chỗ: `guides/02-le-tan.md`, Trả phòng, "Bước 3 – Bill & thu tiền".

> Thu đúng số **Còn phải thu**. Đó là số Desk tính cho cả đơn, gồm mọi khoản. Không lấy Tổng cộng trừ Đã thu.
> Khi có **đêm thêm** (khách ở quá giờ trả muộn cuối), **Tổng cộng** chỉ là tổng các dòng trên màn và có thể lệch số thu:
> - cao hơn, khi đêm thêm làm đơn đủ 7 hoặc 14 đêm (giảm theo số đêm áp lại cho mọi đêm), khi đơn đã có giảm theo số đêm, hoặc khi đơn có mã khách quay lại;
> - thấp hơn, khi khách vượt định mức: đêm thêm có phụ thu người 150.000 mỗi người mà màn chưa có dòng.
> Khách hỏi vì sao hai số khác nhau: đọc số Còn phải thu, nói phiếu in sau khi hoàn tất ghi đủ từng đêm. In phiếu rồi đưa khách xem. Không tự sửa giá đêm cho khớp Tổng cộng.

Tờ 1 (nếu có chỗ, PO): "Trả phòng có đêm thêm: thu theo **Còn phải thu**, không theo Tổng cộng."

Câu cho khách (lễ tân nói, tiếng Anh dẫn): "The amount due is {Còn phải thu}. Your receipt will show each night in full." / "Số cần thanh toán là … Phiếu sẽ ghi đủ từng đêm."

## 5. Thẻ

DOM không mở thẻ mới. Cập nhật hai thẻ đã có:
- **FB-R5-DOM-BA-169-02**: đề xuất sửa = câu mục 4 (thay câu cũ). Mức độ giữ Suggestion, nhưng là điều kiện 1 của phán này: BA làm trước khi phát sổ tay v1.0.5.
- **FB-R5-DOM-ARC-169-01**: lên **Minor, v1.0.6, không phụ thuộc `los_discount`**; gộp với ARC 169-03 thành một việc hợp đồng 0.3.14 (`extraNightPreview { roomVnd, extraPersonVnd, focDeltaVnd }`, `projectedTotalVnd`).
- **FB-R5-ARC-FE-169-03**: DOM đồng ý Minor, v1.0.6. Khi có trường mới, "Tổng cộng" = `projectedTotalVnd`, bảng thêm dòng phụ thu người của đêm thêm, dòng đêm thêm hiện giá sau bậc.

## 6. Giả định

- Bậc giảm trên production đúng như decision-log 06/11 (10 % từ 7 đêm, 15 % từ 14 đêm). Số thật nằm trên Desk; ví dụ ở mục 1 dùng các mức đó và giá Studio công khai.
- Máy chủ áp lại bậc cho mọi đêm khi đêm thêm B18 đổi tổng số đêm (BR-107 S4-38), như ARC và DOM đã đọc ở review #169.

`| 2026-11-07 | 5 | **DOM – phán thẻ ARC FB-R5-ARC-FE-169-03 (#169 Tổng cộng ở bước Bill): chấp nhận cho v1.0.5, không chặn.** DOM sửa giả định của chính review #169 (và ARC): los_discount trên production CHƯA về [] (decision-log 06/11: 10 %/7 đêm, 15 %/14 đêm; từ điển tham số mục lệch sổ tay, B3 của INV chưa làm) – đêm thêm B18 làm đơn đổi bậc thì Tổng cộng cao hơn số thu tới 560.000 (6 → 7 đêm Studio) hay 640.000 (13 → 14), ca vượt định mức thấp hơn 150.000/người. Chấp nhận vì: số thu, trần QR/finalPayment, phiếu in là số máy chủ; v1.0.4 lệch cả đêm thêm (BUG-R4-052); ca hẹp (cần đêm thêm B18); sửa gốc cần hợp đồng 0.3.14 (Desk tự tính bậc trái S4-38). Điều kiện: (1) BA sổ tay câu mới ở thẻ 169-02 (thu đúng Còn phải thu; Tổng cộng có thể cao hơn khi đổi bậc/mã, thấp hơn khi vượt định mức; phiếu in là số đúng); (2) PO release notes v1.0.5 Giới hạn đã biết một dòng; (3) 169-01 lên Minor v1.0.6, bỏ điều kiện "trước khi bật lại los_discount", gộp với ARC 169-03 (extraNightPreview + projectedTotalVnd). ORC nhắc INV ở tổng kết: B3 xong thì phần lớn chênh hết. Không ESC | DOM | rounds/round-05/reviews/DOM-on-arc-card-169-03.md |`
