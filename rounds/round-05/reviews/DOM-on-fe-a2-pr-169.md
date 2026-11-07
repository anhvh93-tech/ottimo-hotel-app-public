# DOM review – FE-A2 PR #169: "Tổng cộng" ở bước Bill khi trả phòng (V5-12, BUG-R4-052)

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #169, commit **`d8712188`**:
  - `CheckOutPage.tsx`: hằng `billTotalVnd`, dòng hiện `bill.total`;
  - test `v5-12-bill-total-fea.test.tsx` (7 ca).
- Đối chiếu:
  - BR-107 v0.5.0 (bảng giá 01/11: không giảm theo số đêm);
  - BR-111 (mã khách quay lại áp trên giá lịch của từng đêm, kể cả giá gõ);
  - BR-416 (đêm thêm khi rời sau mốc cuối nhận bậc BR-107, tính lại mọi đêm; FOC chờ duyệt chặn trả phòng; ESC-031);
  - BR-402 (trần thu không trừ FOC chờ duyệt);
  - hợp đồng S4-38 (giá gõ là giá lịch; `amountDueAtCheckoutVnd` = lệnh B18);
  - `retierStay` trên `main` (bậc và % khách quay lại, lấy mức có lợi hơn);
  - `guides/02-le-tan.md` 11.2 (không đưa bản xem trước cho khách) và bước 3 Bill.
- Cách đọc: `gh pr diff 169` và `git show` trên `origin/main`. Không checkout, không chạy mã. Không dữ liệu khách.

## 0. Kết luận

**DUYỆT.** "Tổng cộng" nay bằng tổng các dòng bảng folio đang hiện:
- các dòng đã ghi;
- đêm thêm theo giá ở ô;
- phần phụ thu trả muộn đổi theo giờ trả, kể cả khi B18 đảo dòng B15 đã ghi;
- phụ thu trả muộn bằng giá 1 đêm (ESC-031), trừ phần miễn mà người xác nhận gửi kèm.

Ca của QA lên 3.168.000 = 2.460.000 + 708.000, khớp "Còn phải thu" khi khách chưa trả gì. Đúng điều lễ tân và khách cần thấy: tổng của đúng các dòng trên màn.

Hai câu FE-A2 hỏi:
1. **Đêm thêm làm đơn sang bậc BR-107 mới: chấp nhận ở v1.0.5**, không bắt tổng theo bậc. Lý do ở mục 1. Kèm hai thẻ Suggestion cho v1.0.6.
2. **Dòng FOC chờ duyệt hiện mà không cộng: đúng.** Lý do ở mục 2.

Không ESC.

## 1. Câu 1 – đêm thêm và bậc giảm

### 1.1 Ca này có xảy ra ở OTTIMO không

- **Bậc giảm theo số đêm đang tắt.** Bảng giá 01/11 ghi "không có giảm theo số đêm", và `los_discount = []` từ ngày chuyển. Không có đơn nào mang bậc cũ, vì chủ đầu tư chưa vận hành trước 01/11 (BR-107 v0.5.0, v0.5.1). Vậy ca "đêm thêm đẩy đơn sang bậc mới" không xảy ra, trừ khi chủ đầu tư bật lại bậc.
- **Ca còn xảy ra được là mã khách quay lại (BR-111).** `retierStay` áp mức có lợi hơn giữa bậc và % khách quay lại, trên giá lịch của mọi đêm, kể cả đêm thêm B18.
  - Đơn Trực tiếp từ báo giá có mã: máy chủ ghi đêm thêm = giá ở ô × (1 − %). Dòng trên Desk vẫn hiện giá trước mã.
  - Vì vậy "Tổng cộng − Đã thu" cao hơn "Còn phải thu" đúng bằng phần mã của một đêm.
  - Ca này không cần đổi bậc. Mức % của mã vẫn là [GIẢ ĐỊNH – chờ INV xác nhận].

### 1.2 Vì sao chấp nhận ở v1.0.5

- **Không thu sai.** Số thu là "Còn phải thu" của máy chủ. Trần QR `check_out` và trần `finalPayment` (422 `AMOUNT_EXCEEDS_BALANCE`) đều là số của máy chủ, đã gồm bậc và mã. Lễ tân không thu quá được.
- **Phiếu đúng.** Phiếu in lúc hoàn tất là số của máy chủ. Bản xem trước không đưa cho khách (`guides/02` 11.2).
- **Lệch về phía có lợi cho khách và nhỏ:** màn hiện cao hơn số khách thật sự trả, chênh không quá phần mã của một đêm. Khách không bị đòi thêm sau khi đã thấy một con số.
- **Dòng đêm thêm hiện giá trước mã đã có từ trước PR này** (S4-38). PR không làm dòng sai thêm. PR chỉ làm tổng khớp với các dòng.
- Bắt tổng theo bậc ở phía Desk thì Desk phải tự tính giá. S4-38 đã cấm việc này: "client không tự cộng chênh".

### 1.3 Điều kiện đi kèm

- Lễ tân **thu đúng "Còn phải thu"**, không lấy "Tổng cộng − Đã thu". Sổ tay đã nói "Thu theo mục 10". Thêm một câu cho rõ (thẻ 169-02).
- Sửa tận gốc ở v1.0.6: máy chủ trả giá đêm thêm đã tính bậc và mã, Desk chỉ hiện (thẻ 169-01). Việc này **phải xong trước khi chủ đầu tư bật lại** `los_discount`. Khi bật lại, chênh có thể là một phần của mọi đêm, không còn nhỏ.

## 2. Câu 2 – dòng FOC chờ duyệt

**Hiện mà không cộng: đúng.**
- Yêu cầu chờ duyệt chưa phải là miễn. Tổng của phiếu là các khoản như đang có. Đây cũng là cách máy chủ tính trần thu lúc nhận phòng (BR-402: trần "không trừ FOC chờ duyệt").
- Ở trả phòng, yêu cầu FOC hay giảm giá còn chờ duyệt **chặn trả phòng** (BR-416 (iii), US-038 AC4). Người duyệt quyết xong thì tổng tự đổi: duyệt thì dòng thành số âm đã áp, từ chối thì dòng không trừ. Vì vậy lễ tân không bao giờ thu theo một tổng còn chờ.
- Phần miễn mà người xác nhận gửi kèm phụ thu 1 đêm (ESC-031) **được** trừ. Đúng: đó là quyết định đã có, bằng tài khoản của người duyệt, không phải yêu cầu chờ (BR-416 (iii)).
- Dòng chờ duyệt cần có chữ "chờ duyệt" cạnh số, để khách không tưởng đã được trừ. Desk đang hiện như trước PR. DOM không thêm thẻ.

## 3. Đối chiếu từng phần của tổng

| Phần | Theo luật | Kết quả |
|---|---|---|
| Dòng đã ghi (`totalVnd`) | Folio hiện tại, gồm FOC đã áp | Đúng |
| Đêm thêm | Giá ở ô (mặc định hoặc lễ tân gõ trong sàn–trần BR-105); chỉ khi `extraNightAvailable` (BUG-R2-139) | Đúng, trừ phần bậc và mã ở mục 1 |
| Phụ thu trả muộn đổi theo giờ | Bậc theo giờ trả thật (BR-412); B18 đảo dòng B15 khi trả đúng giờ (ca 6: 2.460.000) | Đúng, kể cả số âm |
| Phụ thu 1 đêm (ESC-031) | Khi đêm ngày đi không bán được; trừ phần miễn đã duyệt gửi kèm (ca 5: 2.968.000) | Đúng |
| Khách trả thừa | "Còn phải thu" dừng ở 0, tiền thừa hiện riêng | Đúng, "Tổng cộng" không bị cắt |

## 4. Thẻ

### FB-R5-DOM-ARC-169-01
- Mức độ: Suggestion – ARC (hợp đồng 0.3.14), BE, FE-A2. v1.0.6. **Phải xong trước khi chủ đầu tư bật lại `los_discount`.**
- Vị trí: `CheckoutSummary` (`extraNightDefaultRateVnd`, `amountDueAtCheckoutVnd`); dòng đêm thêm và `billTotalVnd` ở `CheckOutPage.tsx`.
- Vấn đề: dòng đêm thêm và "Tổng cộng" dùng giá trước bậc và trước mã khách quay lại. Máy chủ ghi giá sau bậc và mã, và khi có bậc thì tính lại mọi đêm.
- Vì sao quan trọng: hôm nay chênh nhỏ, chỉ ở đơn có mã. Nếu bật lại bậc, chênh có thể là một phần của mọi đêm, ngay trên màn lễ tân đọc cho khách.
- Đề xuất sửa: bản tóm tắt trả phòng trả thêm số đã tính xong: giá đêm thêm sau bậc và mã, và phần các đêm cũ đổi theo bậc. Hoặc trả thẳng một "tổng phiếu nếu hoàn tất bây giờ" cho giờ và giá đang xem. Desk chỉ hiện số đó, không tự tính, đúng S4-38.
- Trạng thái: Open

### FB-R5-DOM-BA-169-02
- Mức độ: Suggestion – BA (`guides/02-le-tan.md`, bước 3 Bill của trả phòng).
- Vị trí: `guides/02` dòng "Bước 3 – Bill & thu tiền. Đọc Tổng cộng, Đã thu, Còn phải thu. Thu theo mục 10."
- Vấn đề: sổ tay chưa nói số nào là số thu, khi "Tổng cộng − Đã thu" khác "Còn phải thu".
- Vì sao quan trọng: lễ tân có thể đọc cho khách số "Tổng cộng − Đã thu", rồi lúng túng khi máy thu ít hơn, hoặc khi phiếu in ra thấp hơn màn.
- Đề xuất sửa: thêm một câu: "Thu đúng **Còn phải thu**. Đơn có mã khách quay lại mà có đêm thêm: đêm thêm trên màn còn là giá trước mã, nên **Tổng cộng** có thể cao hơn phiếu một chút. Phiếu in sau khi hoàn tất là số đúng."
- Trạng thái: Open

## 5. Điểm làm tốt

- Một hằng số, cộng đúng các dòng bảng đang hiện. Không lấy số cần thu của máy chủ, vì số đó đã trừ tiền đã thu và dừng ở 0. PR giải thích lý do này ngay trong mã.
- Bảy ca test phủ đủ các nhánh tiền của BR-416: đêm thêm mặc định, đêm thêm gõ giá, phụ thu tăng, ESC-031 có và không có miễn, đảo dòng B15, trả đúng giờ. Đột biến V0 (mã cũ) làm đỏ đúng 4 ca QA thấy.
- FE-A2 tự nêu giới hạn bậc giảm và FOC chờ duyệt, không giấu.

## 6. Giả định

- `los_discount` trên production vẫn là `[]` (BR-107 v0.5.0). Chủ đầu tư bật lại thì thẻ 169-01 lên trước.
  - **Sửa 07/11 (DOM):** giả định này sai – production còn giảm theo số đêm (decision-log 06/11, từ điển tham số mục lệch sổ tay, B3 chưa làm). Phán lại, câu mới cho thẻ 169-02 và mức mới của 169-01: `rounds/round-05/reviews/DOM-on-arc-card-169-03.md`. Kết luận DUYỆT #169 giữ.
- PR head vẫn là `d8712188` lúc gộp. Nếu UXD chỉ đổi nhãn (ví dụ thêm "(dự tính)"), DOM không cần xem lại.
- DOM không chạy test. Phần máy chủ (`retierStay`, trần thu) DOM đọc mã trên `main`.

## 7. Dòng decision log (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review FE-A2 PR #169 (V5-12, BUG-R4-052, Tổng cộng ở bước Bill) @ d8712188: DUYỆT.** Tổng cộng = tổng các dòng đang hiện (đã ghi + đêm thêm giá ở ô + phụ thu đổi theo giờ, kể cả đảo B15 + phụ thu 1 đêm ESC-031 trừ phần miễn gửi kèm); ca QA 3.168.000. Câu bậc BR-107: chấp nhận ở v1.0.5 – bậc theo số đêm đang tắt (los_discount = [] từ 01/11, không đơn cũ); ca còn xảy ra là mã khách quay lại BR-111 (máy chủ ghi đêm thêm sau mã, Desk hiện giá trước mã), lệch nhỏ, có lợi cho khách; số thu, trần QR, trần finalPayment và phiếu in đều là số máy chủ; Desk không tự tính giá (S4-38). FOC chờ duyệt hiện mà không cộng: đúng (chưa phải miễn; chặn trả phòng BR-416 (iii); trần thu không trừ FOC chờ duyệt như BR-402); miễn gửi kèm ESC-031 được trừ. Thẻ Suggestion: 169-01 ARC/BE/FE-A2 v1.0.6 bản tóm tắt trả giá đêm thêm đã tính bậc và mã (phải xong trước khi bật lại los_discount); 169-02 BA sổ tay: thu đúng Còn phải thu. Không ESC | DOM | rounds/round-05/reviews/DOM-on-fe-a2-pr-169.md |`
