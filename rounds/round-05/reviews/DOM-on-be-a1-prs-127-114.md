# DOM review – PR #127 (V5-10 phần sau #106: tối hôm trước chỉ khi gõ, biên giờ nhận phòng) và PR #114 (V5-11 trả sớm, phí giữ lại 00:00–05:59)

- Người review: DOM | Round 5 – bước Review (nghiệp vụ) | Ngày: 07/11/2026
- Đối tượng (BE-A1, cả hai đang nháp; thứ tự gộp #127 → #113 → #114):
  - PR #127, nhánh `r5-text-strip` @ `5c66ca15`: `frontdesk/internal/checkout-at.ts`, `checkout.service.ts` `resolveCheckoutAt`, `reservations/internal/inputs.ts` `Fields.text`, khóa audit; test `be-a1-v105-units.test.ts`, `integration/v105-checkout-at.test.ts`.
  - PR #114, nhánh `r5-a2` @ `f730b691`: `stay.service.ts` `earlyDeparture`, `allowed-actions.ts` `earlyDepartureOpen`, `folio.service.ts` `voidStay`, `reservations.service.ts` (hủy, không đến), `checkout.service.ts` (`deposit_forfeit`); test `integration/v105-early-hours.test.ts`, `be-a1-v105-units.test.ts`.
- Đối chiếu:
  - BR-010, BR-011, BR-309, BR-311, BR-412, BR-414, BR-428, BR-602, BR-903, BR-904 (`product/docs/business-rules.md` v0.5.15);
  - DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 2 (V5-11), 7.6, 15 (V5-10);
  - review trước của DOM `rounds/round-05/reviews/DOM-on-be-prs-106-99-checkout.md` (thẻ PR106-01, PR106-02);
  - oracle `product/tests/fixtures/br-examples.json`: BR-428-12 … 17, BR-309-27, BR-311-04 (nhánh PR giống hệt `main`);
  - Desk v1.0.4 trên `main`: `admin-web/src/app/dates.ts` `checkoutInstant`, `pages/stay/CheckOutPage.tsx`, `pages/stay/EarlyDepartureDialog.tsx`;
  - PR #99 @ `92d16358` `readInput` (B18 bắt buộc `checkoutTime` hoặc `checkoutAt`; đơn quá ngày đi bắt buộc `checkoutAt`).
- Cách đọc: `git show origin/<nhánh>:<tệp>` và `gh pr diff`, không checkout. DOM không chạy test. CI của cả hai PR lúc review còn đang chạy (`gh pr checks`): ORC xem kết quả trước khi gộp.
- Không có dữ liệu khách, không có tỷ lệ hay số tiền hoa hồng. Giá 700.000, 800.000, 1.600.000 là số ví dụ của oracle và test.

Gọi **W** là 00:00–05:59 ngày lịch D+1, khi ngày nghiệp vụ vẫn là D (BR-010).

## 1. Kết luận

- **PR #127 @ `5c66ca15`: ĐẠT về nghiệp vụ.**
  - Thẻ FB-R5-DOM-BE-PR106-01 đã sửa đúng đề xuất.
  - Biên "không sớm hơn giờ nhận phòng thật" (SEC A1A-01) đúng thực tế: khách không thể rời trước khi tới.
  - Luật đêm W đúng ở cả năm điểm DOM kiểm (mục 2.1).
  - Hệ quả đã chấp nhận (Desk v1.0.4, VietQR trả phòng cho ca "khách đi tối hôm trước") hẹp hơn mô tả, và không làm sai tiền (mục 2.2).
  - Không có thẻ mới cho BE. DOM sửa đề xuất của chính mình ở thẻ PR106-02 (mục 2.3), việc cho ARC ở 0.3.14.
- **PR #114 @ `f730b691`: ĐẠT về nghiệp vụ.**
  - Khớp từng số của oracle BR-428-14 … 17, BR-309-27, BR-311-04 và luật DOM mục 2.1 (1)–(5).
  - Hai câu BE hỏi DOM: đồng ý cả hai (`useCheckout` khi ngày đi ≤ ngày lịch; `deposit_forfeit` ghi ngày nghiệp vụ).
  - Một thẻ Suggestion (PR114-01, ca kiểm hoa hồng), không chặn gộp.
- Điều kiện phát hành (không phải điều kiện gộp, việc của ORC và PO): #127 lên cùng tag với FE-A V5-10, #114 lên cùng tag với FE-A V5-11. Nếu phần FE trễ sang bản sau: release notes ghi hai dòng "Giới hạn đã biết" ở mục 4.

## 2. PR #127

### 2.1 Luật đêm 00:00–05:59: DOM kiểm năm điểm

Ví dụ chung: đơn trực tiếp 22–24/11, giá ví dụ 700.000, giờ trả chuẩn 12:00, rollover 06:00, ngưỡng lệch 30 phút. Khách nhận phòng 15:00 ngày 22/11. Ngày đi 24/11, nên W của ngày đi là 00:00–05:59 ngày 24/11, ngày nghiệp vụ 23/11.

| # | Điểm kiểm | Ca | Kết quả #127 | Đúng luật? |
|---|---|---|---|---|
| 1 | Không gõ giờ thì không có "tối hôm trước" (PR106-01, rules 15.2) | 01:00 ngày 24/11, tóm tắt không gửi giờ | 24/11 12:00, `checkoutAtAfterNow`; QR không kèm giờ → 422 `TIME_AFTER_ACTION`, không tạo `payment` | Đúng. Trước đây ra 23/11 12:00, nên khai báo lưu trú lệch một ngày (BR-010, BR-602) |
| 2 | Giờ gõ trước 06:00 là giờ của ngày đi (BUG-R4-051) | 01:00 ngày 24/11, Desk điền sẵn 01:00 | 24/11 01:00, `postMidnight`, phụ thu **0**, B18 qua | Đúng (T-10-14) |
| 3 | Giờ gõ từ 06:00 trong W là tối hôm trước | 01:05 ngày 24/11 gõ 23:50 | 23/11 23:50, phụ thu **0**, bắt buộc ghi chú (lệch 75 phút > 30) | Đúng (T10-8) |
| 4 | Đêm D đã ở. Khách còn trong căn sau nửa đêm của **ngày nghiệp vụ = ngày đi** thì có đêm thêm | Ngày đi 23/11, 01:05 ngày 24/11 gõ 01:00 | 24/11 01:00, sau mốc cuối → đêm thêm (T10-2) | Đúng BR-421, #127 không đổi |
| 5 | Không rời trước khi tới (A1A-01) | Đơn 23–24/11, khách tới muộn, nhận phòng 01:00 ngày 24/11 | Gửi 00:30 → 422 `DATE_INVALID` ở tóm tắt, QR và B18, không ghi gì; 01:10 → 200, phụ thu 0 | Đúng |

**Giờ điền sẵn tính là gõ.** Desk điền giờ máy quầy (KB7) rồi gửi `checkoutTime`. Máy chủ không phân biệt được hai kiểu, nên coi là gõ. DOM đồng ý: lễ tân nhìn thấy giờ đó và bấm Trả phòng với giờ đó.

Cách này không sinh "tối hôm trước" sai. Trong W, giờ máy quầy luôn trước 06:00, nên giờ điền sẵn luôn rơi vào ngày đi (điểm 2). Ứng viên tối hôm trước chỉ có khi lễ tân tự sửa thành giờ từ 06:00 trở đi.

**B18 luôn là gõ hoặc gửi giờ**, cả trước lẫn sau khi #99 gộp: `readInput` bắt buộc `checkoutTime` hoặc `checkoutAt` (#99: đơn quá ngày đi bắt buộc `checkoutAt`). Lệnh không gõ giờ chỉ còn hai chỗ:
- lần tóm tắt đầu, trước khi Desk điền giờ;
- VietQR không kèm `checkoutAt`.

Cả hai không ghi gì vào đơn hay khai báo.

**Biên giờ nhận phòng ở nhánh quy đổi** (ARC hỏi về mã lỗi): về nghiệp vụ, DOM không thấy ca thật nào ra `DATE_INVALID` trên `checkoutTime`. Mã này chỉ dùng để chặn, không cần chữ riêng. Ca PU1 gõ 00:30 ra `TIME_AFTER_ACTION`, tức chỉ dẫn "giờ trả muộn hơn lúc bấm". Chỉ dẫn này không đúng hẳn, nhưng ca chỉ có khi thử phá. DOM không đề nghị đổi.

**Ca "gõ 17:00 lúc 01:00" giữ là tối hôm trước** (23/11 17:00, phụ thu 0, bắt buộc ghi chú). DOM đồng ý: lễ tân đã cố ý sửa giờ điền sẵn, và ghi chú bắt buộc ghi lại lý do. Xem thêm mục 2.3: khách đi từ sáng 23/11 cũng chỉ ghi được bằng đường này.

### 2.2 Hệ quả đã chấp nhận, phạm vi thật

PR viết: Desk v1.0.4 tạo QR cho ca "gõ 23:50 lúc 01:05" sẽ bị 422 tới khi FE-A V5-10 lên. DOM đã đọc `checkoutInstant` của Desk v1.0.4. Phạm vi hẹp đúng như vậy:

- **Bị 422:** chỉ khi lễ tân sửa giờ thành từ 06:00 trở đi trong W của ngày đi (khách đi tối hôm trước). Desk v1.0.4 không gửi `checkoutAt` cho giờ này (ngoài khung [ngày đi 00:00, ngày đi + 1 06:00)). Máy chủ quy đổi giờ chuẩn 12:00 ngày đi, ở tương lai → 422.
- **Không ảnh hưởng:** khách đứng ở quầy lúc 01:05 và trả bằng VietQR. Desk điền 01:05, gửi `checkoutAt` 24/11 01:05, QR tạo bình thường.
- **Tóm tắt và B18 của ca tối hôm trước vẫn làm được.** Desk v1.0.4 gửi `checkoutTime` 23:50 (gõ), máy chủ ra 23/11 23:50, phụ thu 0.
- **Tiền không sai:** khách đã đi từ tối, không ở quầy để quét QR. Lễ tân trả phòng như thường. Còn nợ thì ghi công nợ (BR-525), hoặc chờ FE-A V5-10.

DOM giữ chấp nhận như ở thẻ PR106-01.

### 2.3 Sửa đề xuất thẻ FB-R5-DOM-BE-PR106-02 (của DOM, việc ARC 0.3.14 / v1.0.6)

Thẻ PR106-02 (khách đi tối hôm trước, quầy biết sau 06:00) đề xuất ba điều kiện cho `checkoutAt` có ngày nghiệp vụ = ngày đi − 1. DOM **bỏ điều kiện thứ hai** ("không sớm hơn `checkin_time` của ngày đi − 1"). Lý do: khi #114 gộp, ca này không còn đường nào khác.

- Ví dụ: đơn 21–24/11. Khách bỏ đi lúc 08:00 ngày 23/11, không báo. Buồng phòng thấy căn trống lúc 01:30 ngày 24/11 (W) hoặc 07:30 ngày 24/11.
- Trả sớm B16 không làm được ở cả hai lúc:
  - 01:30 ngày 24/11: lượt đi hôm nay theo ngày lịch → 409 `useCheckout` (#114);
  - 07:30 ngày 24/11: Ngày rời mới tối thiểu = 24/11 = ngày đi → không có ngày hợp lệ.
- Vậy chỉ còn Trả phòng B18. Có điều kiện thứ hai thì B18 cũng từ chối 23/11 08:00. Lễ tân phải ghi một giờ của ngày 24/11, khai báo lệch một ngày.
- Về tiền, không mất gì khi bỏ điều kiện:
  - đêm 23/11 vẫn tính. Khách bỏ đi không báo thì báo trước 0 ngày, BR-428 không hoàn;
  - nếu B16 làm kịp lúc 08:00 ngày 23/11, phần giữ lại cũng là 100 % đêm 23/11 (700.000), chỉ khác dòng "phí trả phòng sớm" thay vì tiền phòng.
- **Đề xuất mới cho v1.0.6:** nhận `checkoutAt` có ngày nghiệp vụ = ngày đi − 1 mỗi khi B18 còn mở cho lượt. Hai điều kiện:
  - không sớm hơn giờ nhận phòng thật (A1A-01, đã có ở #127);
  - phụ thu 0, bắt buộc ghi chú (đã có).
- #127 hiện đã làm đúng như vậy trong W: ca "gõ 08:00 lúc 01:05" trên đơn nhiều đêm ra 23/11 08:00, kèm ghi chú. DOM xác nhận đó là hành vi đúng, không phải lỗi.
- Trạng thái thẻ PR106-02: vẫn Open, đề xuất sửa như trên.

### 2.4 `Fields.text` bỏ ký tự điều khiển (SEC A1B-01): nghiệp vụ

- Ghi chú chỉ toàn ký tự ẩn → `TIME_NOTE_REQUIRED`. Đúng BR-414: lễ tân không lách được ghi chú bắt buộc bằng một ký tự không thấy.
- Tập ký tự bị bỏ (`shared/validation.ts`): C0 trừ tab và xuống dòng, C1, U+200B–U+200F, U+202A–U+202E, U+2066–U+2069. **Không có dấu kết hợp U+0300–U+036F.**
  - Tiếng Việt gõ dạng tổ hợp (dán từ PDF, Word, một số bàn phím) vẫn giữ dấu: "Nguyễn" không thành "Nguyen".
  - Tiếng Hàn, Trung, Nga (thị trường của OTTIMO) không cần U+200C/U+200D.
- 38 chỗ gọi `.text(` chủ yếu là ghi chú, lý do, mã tham chiếu. Tên duy nhất đi qua đây là tên trẻ em trong đoàn (`childName`, `party.service.ts`). Tên đó vẫn giữ đủ dấu vì tập bỏ không có dấu kết hợp, nên khai báo lưu trú không bị ảnh hưởng.

## 3. PR #114

### 3.1 Đối chiếu số với oracle (đọc test integration)

| Oracle / ca DOM | Đầu vào | Mong đợi (luật) | #114 (test) | Đạt |
|---|---|---|---|---|
| BR-428-14, T-11-1 | Đơn 20–24/10 × 700.000, 03:00 ngày 21/10, Ngày rời mới 21/10 | Báo trước 1 ngày; giữ đêm 20/10; bỏ 21, 22, 23 = 2.100.000; hoàn 50 % = **1.050.000**; phí **1.050.000** | Xem trước và ghi cùng số; đêm 20/10 còn trên folio, 21–23 đã đảo | Có |
| BR-428-16, T-11-3 | Dòng phí của ca trên | Ngày dịch vụ **20/10** | `early_departure_fee` 1.050.000 ngày 20/10 | Có |
| BR-428-15, T-11-2 | Đơn 19–24/10, 03:00 ngày 21/10, Ngày rời mới 20/10, cả `dryRun` | 409, `minNewDepartureDate` 21/10, đơn và folio không đổi | 409 `INVALID_TRANSITION`, đếm lại đơn, đêm, dòng folio, yêu cầu duyệt, audit: không đổi | Có |
| Ghi chú BR-428-15 | Đơn đến 20/10, gửi 20/10 lúc 03:00 ngày 21/10 | 409 kèm chỉ dẫn, không phải 422 "≤ ngày đến" | 409, `minNewDepartureDate` 21/10 | Có |
| BR-428-17, T-11-4 | Đơn 20–21/10, 03:00 ngày 21/10 | Không có nút Trả sớm; lệnh gửi thẳng → 409 `useCheckout`; Trả phòng được, phụ thu 0 | `allowedActions` chỉ có `check_out`; 409 `useCheckout` cả xem trước lẫn ghi; tóm tắt 03:00: `postMidnightWindow`, không đêm thêm, phụ thu 0, còn phải thu 0; B18 200 | Có |
| BR-428-12/13, T-11-5 | Đơn 20–24/10, 05:59 và 06:00 ngày 21/10 | 05:59: tối thiểu 21/10, báo trước 1 ngày, hoàn 1.050.000; 06:00: báo trước 0, không hoàn; gửi 20/10 lúc 06:00 → 422 như cũ | Đúng cả ba | Có |
| BR-309-27, T-11-7 | Hủy 01:30 ngày 22/10, đơn đến 25/10, cọc 700.000 | Báo trước 4 ngày (25/10 − 21/10), giữ **350.000**, hoàn 350.000; dòng phí hủy ngày **21/10** | Đúng; cọc 700.000 dựng từ 3 đêm × 800.000 (30 % = 720.000, làm tròn 100.000) | Có |
| BR-311-04, T-11-8 | Đánh dấu không đến 00:40 ngày 21/10, đơn đến 20/10, cọc 500.000 | Giữ **500.000**, dòng phí ngày **20/10** | Đúng; cọc 500.000 từ 1 đêm × 1.600.000 (480.000 → 500.000) | Có |
| Luật 2.1 (5), `deposit_forfeit` | Đơn 20–21/10, B18 lúc 02:00 ngày 21/10, khách để lại 100.000 tiền thừa (quản lý ghi) | Ngày dịch vụ = ngày nghiệp vụ **20/10** | `deposit_forfeit` 100.000 ngày 20/10 | Có |

Phần mã khớp luật:
- **Số đêm tính.** Trong W, Ngày rời mới tối thiểu là ngày lịch (`minCalendarDate`, cùng hàm với V5-10). Đêm D không đảo được ở bất kỳ lệnh nào, kể cả `dryRun`.
- **Hoàn tiền.** Số ngày báo trước tính theo ngày nghiệp vụ lúc báo (BR-011), không đổi. Khách báo trong W rời ngay hôm đó (ngày lịch) = báo trước 1 ngày, như BR-428-12.
- **Thứ tự kiểm.** Kiểm W chạy trước mọi kiểm ngày của `newDepartureDate`, sau kiểm vai, trạng thái, đơn chính và dạng thân lệnh. Đúng luật 2.1 (2) ý 3: lễ tân luôn nhận đúng chỉ dẫn.
- **Ngoài W giữ như cũ** (06:00–23:59): tối thiểu = ngày nghiệp vụ, sai thì 422 `DATE_INVALID`.
- **Nút trên Desk.** `allowedActions.early_departure` dùng cùng ngày tối thiểu. Lượt đi hôm nay theo ngày lịch chỉ có Trả phòng, ngay cả trên Desk v1.0.4 vì Desk đọc `allowedActions`. Chỉ có một chỗ dựng ngữ cảnh nút (`reservations.service.ts`), và chỗ đó truyền `calendarDate`.
- **Mọi đường ghi phí giữ lại đều có ngày nghiệp vụ.** Bốn chỗ gọi `voidStay` truyền `businessDate` khi có tiền giữ lại:
  - hủy (gồm OTA, tiền phạt BR-310);
  - không đến;
  - giữ chỗ hết hạn và chuyển khách (overbooking) giữ 0.

  Câu chặn `retainedVnd > 0 without businessDate` vì vậy không làm hỏng đường nào hiện có. Đánh dấu không đến chỉ làm tay (không có job), nên ngày nghiệp vụ luôn là lúc lễ tân bấm.

### 3.2 Folio và hoa hồng

- **Folio** (ca BR-428-14):
  - đêm 20/10 giữ là tiền phòng 700.000, tính là đêm bán; Occupancy và ADR của 20/10 không bị hụt;
  - đêm 21–23/10 đảo;
  - phụ thu người của các đêm bỏ (nếu có) hoàn 100 % như BR-428, mã không đổi;
  - một dòng "phí trả phòng sớm" 1.050.000 ngày 20/10, doanh thu khác (BR-904);
  - một yêu cầu hoàn 1.050.000 theo BR-522.
- **Hoa hồng (BR-903):**
  - cơ sở = tiền phòng + phụ thu người của các đêm còn giữ, sau FOC. Đơn CTV ở ca BR-428-14: cơ sở giữ **700.000** của đêm 20/10, hoa hồng = `test_rate_short` × 700.000;
  - phí trả phòng sớm 1.050.000 **không** vào cơ sở (BR-903 (2), BR-428; ESC-051 câu 1 phương án A);
  - trước #114, lệnh gửi Ngày rời mới 20/10 lúc 03:00 được nhận. Lệnh đó bỏ cả đêm 20/10 khỏi cơ sở: sale hoặc CTV mất hoa hồng của một đêm khách đã ở, và khách được hoàn tiền một đêm đã ngủ;
  - #114 không đổi cách tính hoa hồng. Hoa hồng không đọc ngày dịch vụ của dòng phí (mốc "đạt" theo `recognized_at`), nên đổi ngày dòng phí không dời kỳ chi;
  - thẻ PR114-01 đề xuất một ca kiểm để khóa điểm này.

### 3.3 Trả lời hai câu BE hỏi DOM

1. **`useCheckout` khi ngày đi hiệu lực ≤ ngày lịch (không chỉ "="): đồng ý.**
   - Ngày đi = ngày nghiệp vụ D, lúc 03:00 ngày D+1: khách đã ở qua đêm D, sau ngày đi. Trả phòng tính đêm thêm (BR-421, T10-2). Trả sớm không có ngày rời hợp lệ nào.
   - Ngày đi trước D: đơn quá ngày đi (V5-15), quản lý hoặc chủ đầu tư trả phòng. Lễ tân thấy chỉ dẫn theo `nightsNotBilled` (FE-A V5-15).
   - Trả `minNewDepartureDate` = D+1 cho hai ca này là gợi ý sai, vì D+1 vẫn ≥ ngày đi. ARC muốn dùng "=" thì phải xử lý riêng hai ca đó. DOM đề nghị giữ "≤".
2. **`deposit_forfeit` ở B18 sau nửa đêm ghi ngày nghiệp vụ (ngày hôm trước): đồng ý**, theo BR-010 v0.5.12 và luật 2.1 (5).
   - Ban ngày không đổi: B18 chỉ mở khi ngày nghiệp vụ = ngày đi.
   - Đơn quá ngày đi (#99): dòng ghi ngày nghiệp vụ lúc ghi B18, không ghi ngày đi. DOM đồng ý. Tiền thừa chỉ thành "giữ lại" khi folio đóng, cùng mốc với hoa hồng (`folio.settled_at`, rules 15.5).
   - Ví dụ: khách đi 30/11, quản lý ghi 01/12 lúc 09:00 → dòng `deposit_forfeit` ngày 01/12 (doanh thu khác tháng 12). Ca hiếm, số nhỏ.

### 3.4 Thay đổi ngoài W cần báo (không phải lỗi)

`early_departure_fee` **ban ngày** đổi ngày dịch vụ: trước đây là Ngày rời mới, nay là ngày nghiệp vụ lúc thao tác. Đúng câu BR-010 v0.5.12 "ngày nghiệp vụ lúc thao tác (hủy, đánh dấu không đến, trả sớm)", và cùng cách với phí hủy (ngày hủy, không phải ngày đến).

- Ví dụ: đơn 25/11–05/12 × 700.000. 10:00 ngày 29/11, khách báo rời 02/12 (báo trước 3 ngày).
  - Bỏ 3 đêm (02, 03, 04/12) = 2.100.000 → hoàn 1.050.000, phí 1.050.000.
  - Dòng phí trước đây mang ngày 02/12 (tháng 12), nay mang ngày **29/11** (tháng 11).
- Test BR-428-16 đã khóa dòng mã này: Ngày rời mới 21/10 khác ngày mong đợi 20/10. Không cần ca ban ngày riêng.
- Việc: DATA xác nhận K-22e "doanh thu khác theo ngày" đọc ngày này (T-11-9). PO hoặc BA ghi một dòng release notes v1.0.5 cho chủ đầu tư: "Phí trả phòng sớm, phí hủy, phí không đến ghi vào ngày thao tác (ngày nghiệp vụ, đổi lúc 06:00)."

## 4. Ghi chú cho vai khác (không phải thẻ BE)

- **ORC / PO (phát hành):**
  - #127 lên cùng tag với FE-A V5-10, #114 lên cùng tag với FE-A V5-11.
  - Nếu phần FE trễ sang bản sau, release notes "Giới hạn đã biết" ghi hai dòng:
    - (a) "00:00–05:59, khách đã đi từ tối hôm trước: VietQR trả phòng báo lỗi. Trả phòng vẫn làm được; còn nợ thì ghi công nợ."
    - (b) "00:00–05:59, Trả sớm: chọn Ngày rời mới là ngày hôm nay theo lịch." Desk v1.0.4 đặt sẵn ngày hôm trước, máy chủ trả lỗi chung `INVALID_TRANSITION`.
  - Cả hai dòng không làm sai tiền. Trước #114, Desk v1.0.4 nhận ngày hôm trước và hoàn đêm khách đã ở.
- **FE-A:**
  - (V5-10) Lần tóm tắt đầu trong W (chưa gửi giờ) nay trả giờ chuẩn của ngày đi kèm `checkoutAtAfterNow`. Không lấy số này làm giờ điền sẵn (rules 15.2), và không hiện cảnh báo "giờ trả sau giờ hiện tại" từ lần đọc chưa có giờ.
  - (V5-11) Ô Ngày rời mới trong W đặt sẵn ngày lịch. Đọc `minNewDepartureDate` và `useCheckout` của 409 để hiện chỉ dẫn (rules 2.3).
- **ARC:**
  - 0.3.14: ghi `DATE_INVALID` trên `checkoutTime` (mục 2.1, DOM không phản đối).
  - Ghi đề xuất PR106-02 đã sửa (mục 2.3).
  - Câu "≤" của `useCheckout` (mục 3.3 ý 1).
- **DATA:** mục 3.4 (K-22e, ca T-11-9).
- **QA:**
  - Sau khi #114 gộp, bỏ `pendingFix` ở BR-428-15, 16, 17, BR-309-27, BR-311-04.
  - Chạy giờ thật trên staging các ca T-10-14 (rules 15.6), T-11-1 … T-11-9 (rules 2.4).
  - Thêm ca mục 2.3: đơn nhiều đêm, 01:05 ngày đi gõ 08:00 → 23/11 08:00, phụ thu 0, đòi ghi chú.
- **BA:** sổ tay ca đêm, câu "khách bỏ đi từ sáng hôm trước, quầy biết lúc đêm: Trả phòng, gõ giờ khách đi thật, ghi chú; đêm cuối vẫn tính" (mục 2.3).
- **DOM (việc của mình):** BR bản kế tiếp (v0.5.16): BR-428 ghi rõ ca trên (khách bỏ đêm cuối không báo, phát hiện khi Trả sớm không còn mở → Trả phòng, đêm cuối tính); BR-010 thêm ví dụ phí trả sớm ban ngày của mục 3.4.

## 5. Thẻ

### FB-R5-DOM-BE-PR114-01
- Mức độ: Suggestion
- Vị trí: `product/services/api/test/integration/v105-early-hours.test.ts` (ca T-11-1).
- Vấn đề:
  - Ca BR-428-14 dùng đơn trực tiếp không có người hưởng hoa hồng.
  - Hệ quả hoa hồng của V5-11 chưa có ca kiểm nào khóa: giữ đêm 20/10 trong cơ sở, phí trả sớm không vào cơ sở.
- Vì sao quan trọng:
  - Lỗi cũ (nhận Ngày rời mới 20/10 lúc 03:00) làm sale hoặc CTV mất hoa hồng một đêm khách đã ở. Đơn CTV ở OTTIMO đi nhánh Trực tiếp (BR-428).
  - Có thể sai thêm: phí trả sớm bị cộng vào cơ sở khi V5-30 (H2) đổi cơ sở cho đơn hủy và không đến (BR-903 (2)).
- Đề xuất sửa: thêm một ca, gộp ở PR này hoặc PR V5-30.
  - Đơn có người hưởng (sale hoặc CTV), cùng số BR-428-14, tỷ lệ `test_rate_short`.
  - Sau B16 lúc 03:00 ngày 21/10: hoa hồng `projected` có cơ sở = 700.000 (đêm 20/10), không gồm 1.050.000 phí trả sớm.
  - Không ghi tỷ lệ hay số tiền thật.
- Trạng thái: Open

## 6. Dòng đề xuất ghi `decision-log.md` (ORC ghi khi commit)

`| 2026-11-07 | 5 | **DOM – review nghiệp vụ PR #127 (V5-10 phần sau #106) và PR #114 (V5-11)** (rounds/round-05/reviews/DOM-on-be-a1-prs-127-114.md): #127 @ 5c66ca15 ĐẠT – tối hôm trước chỉ khi gõ giờ (giờ Desk điền sẵn tính là gõ, B18 luôn gõ hoặc gửi giờ), không rời trước giờ nhận phòng thật ở mọi nhánh; hệ quả Desk v1.0.4 chỉ là VietQR trả phòng cho ca khách đi tối hôm trước (giờ gõ từ 06:00 trong 00:00–05:59), không sai tiền. #114 @ f730b691 ĐẠT – khớp oracle BR-428-14…17, BR-309-27, BR-311-04; useCheckout khi ngày đi hiệu lực ≤ ngày lịch; dòng phí giữ lại (gồm deposit_forfeit, cả đơn quá ngày đi) mang ngày nghiệp vụ lúc thao tác, phí trả sớm ban ngày cũng đổi từ ngày rời mới sang ngày thao tác; thẻ PR114-01 Suggestion (ca kiểm hoa hồng). DOM sửa đề xuất thẻ PR106-02: bỏ điều kiện "không sớm hơn checkin_time của ngày đi − 1", chỉ giữ biên giờ nhận phòng thật, vì khách bỏ đêm cuối phát hiện khi Trả sớm không còn mở chỉ còn đường Trả phòng (đêm cuối vẫn tính). Phát hành: #127 cùng tag FE-A V5-10, #114 cùng tag FE-A V5-11, không thì 2 dòng Giới hạn đã biết | DOM | Quyền DOM (đúng nghiệp vụ); không đổi số của INV |`

## 7. Điểm làm tốt

- Cờ `typed` một chỗ trong hàm thuần, cả ba đường tóm tắt, QR và B18 đi qua. Sửa PR106-01 không đụng nhánh `checkoutAt` gửi lên, nên T10-8 và đường FE-A V5-10 giữ nguyên.
- Test V5-11 đọc thẳng oracle trong `br-examples.json` và dựng cọc đúng số oracle bằng giá thật của luật làm tròn. Ca từ chối đếm lại cả đơn, đêm, dòng folio, yêu cầu duyệt và audit. Không ai phải dò số tay.
- Một hàm `minCalendarDate` cho máy chủ B16, nút Desk và B18. Lễ tân không còn thấy nút Trả sớm mà máy chủ sẽ từ chối.
