# DOM review – PR #106 (V5-10, một giờ trả phòng) và PR #99 (V5-15, trả phòng quá ngày đi)

- Người review: DOM | Round 5 – bước Review (nghiệp vụ) | Ngày: 07/11/2026
- Đối tượng:
  - PR #106, nhánh `r5-a1a` @ `897656de` (BE-A1): `frontdesk/internal/checkout-at.ts`, `checkout.service.ts`, `shared/business-day.ts`, `allowed-actions.ts`, `stay-actions.ts`, test `be-a1-v105-units.test.ts`.
  - PR #99 (nháp), nhánh `r5-a1b` @ `ba99bdb8` (BE-A2): `checkout.service.ts` nhánh `overdue` trong `decide`, `readInput`, khối ghi trạng thái; `reservations/public/overdue-checkout.ts`; cổng minibar `minibar-checkout.port.ts`.
- Đối chiếu:
  - BR-010, BR-412, BR-414, BR-416, BR-421, BR-433, BR-602, BR-903 (`product/docs/business-rules.md` v0.5.13);
  - hợp đồng 0.3.13 mục 1.1, 1.4, 1.18, 1.19 (`rounds/round-05/outputs/ARC/contract-0.3.13.md`);
  - DOM `rules-v1.0.5.md` mục 7.1;
  - decision-log 17/10 (FE KB7: giờ trả điền sẵn = giờ máy quầy), DOM 18/10 (hoa hồng và tiền về sau trả phòng);
  - mã trên `main`: `folio/public/folio.service.ts` `tryEarnCommissions`, `payments/public/payment.service.ts` `reconciliationFor`, `admin-web/src/pages/stay/CheckOutPage.tsx` (giờ điền sẵn).
- Luật chi tiết: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` **mục 15 mới** (15.1 giờ rời thật, 15.2 giờ điền sẵn, 15.3 không rõ giờ, 15.4 đơn quá ngày đi, 15.5 mốc hoa hồng, 15.6 ca kiểm, 15.7 việc theo vai).
- Không có dữ liệu khách, không có tỷ lệ hay số tiền hoa hồng. Giá 700.000 trong ví dụ là số ví dụ của BR-412.

## 1. Kết luận

- **PR #106: ĐẠT về nghiệp vụ.**
  - Luật "một giờ cho tóm tắt, VietQR và Trả phòng" đúng thực tế quầy.
  - QR vắng giờ lấy giờ hẹn, không có thì giờ chuẩn: đúng BR-414 (phụ thu không tự áp).
  - Thẻ 01 (Minor) nên sửa cùng PR, không chặn gộp. Thẻ 02 (Minor) đề xuất dời v1.0.6.
- **PR #99: ĐẠT CÓ ĐIỀU KIỆN.**
  - Điều kiện duy nhất: thẻ PR99-01 (**Major**, mốc hoa hồng) sửa trước khi gộp.
  - Bảy giả định của BE-A2: DOM xác nhận sáu, sửa một (hoa hồng). Xem mục 3.
  - Thẻ 02 (Minor), 03 (Suggestion) không chặn.

## 2. PR #106 – trả lời câu của ORC

### 2.1 Khách trả 11:40, lễ tân bấm 12:10: phí trả muộn tính theo giờ nào

**Theo 11:40**, tức giờ khách rời thật (BR-412 "theo giờ trả thực tế"). Lúc bấm 12:10 chỉ dùng để kiểm dung sai và ghi nhật ký (BR-414).

PR #106 làm đúng như vậy:
- `checkoutAt` (gửi lên, hoặc quy đổi từ giờ gõ) là giờ duy nhất cho tóm tắt, trần QR, `amountDueNow` và B18.
- Giờ máy chủ chỉ dùng cho ba việc:
  - `afterNow`: muộn hơn lúc bấm quá 30 phút → 422 `TIME_AFTER_ACTION`;
  - `noteRequired`: sớm hơn quá 30 phút → bắt buộc ghi chú;
  - audit `systemTime`.
- 11:40 so với 12:10 lệch đúng 30 phút, chưa quá ngưỡng (`-diff > tolerance` là điều kiện quá), nên không đòi ghi chú. Đúng ví dụ BR-414.

Ở quầy, chỗ dễ sai là **giờ điền sẵn**, không nằm ở máy chủ. Desk điền giờ máy quầy lúc mở Trả phòng (quyết định 17/10, KB7). Lễ tân không sửa thì khách bị tính theo lúc bấm:

| Ca (giá đêm cuối 700.000, ngưỡng lệch 30 phút) | Giờ ghi | Phụ thu | Ghi chú? |
|---|---|---|---|
| Căn không có khách đến cùng ngày, để nguyên 12:10 | 12:10 | 0 (trong ân hạn 12:30) | Không |
| Căn không có khách đến, sửa 11:40 | 11:40 | 0 | Không |
| Căn **có** khách đến 14:00, để nguyên 12:10 | 12:10 | 210.000 – **sai**, khách bị tính oan | – |
| Căn có khách đến, sửa 11:40 | 11:40 | **0** | Không |
| Bấm 12:15, sửa 11:40 | 11:40 | 0 | **Có** (lệch 35 phút) |
| Khách trả chìa 12:25, bấm 12:40, căn không có khách đến, để nguyên | 12:40 | 210.000 – **sai**; sửa 12:25 → 0 | Không |

Chiều ngược lại (lễ tân khai sớm để bỏ phụ thu) bị chặn bởi ngưỡng 30 phút. Quá ngưỡng thì phải ghi chú, có nhật ký và vào danh sách đóng ca. DOM giữ như BR-414, không thêm bước.

Việc cho BA và UXD (không phải thẻ BE): sổ tay và một dòng nhắc trên Desk "giờ trả là lúc khách trả chìa, không phải lúc bấm" (rules 15.1, 15.7).

### 2.2 Một `checkoutAt` cho tóm tắt, QR và Trả phòng: đúng thực tế

- Khách nhìn bill, quét QR và nhận phiếu cùng một số tiền. Nếu mỗi lệnh tự lấy giờ riêng, bill lập 12:28 và QR tạo 12:33 ra hai số khác nhau khi qua mốc 12:30, hoặc khi căn có khách đến. BUG-R4-051 cùng họ lỗi này: hai chỗ đọc cùng một giờ gõ ra hai ngày khác nhau.
- Phí do lúc khách rời quyết định, không do thủ tục kéo dài bao lâu. Giữ một giờ từ lúc tóm tắt là đúng.
- Khách còn trong căn lúc lễ tân lập bill trước: lễ tân đổi giờ khi khách trả chìa. Desk đọc lại tóm tắt, rồi mới tạo QR (rules 15.1 ý 3). Nếu không đổi, lệch tối đa 30 phút. Quá 30 phút thì B18 đòi ghi chú, nên không thất thoát lặng lẽ.

### 2.3 QR vắng giờ lấy giờ hẹn, không có thì giờ chuẩn (C0313-08): đồng ý

- Số khách phải trả không được có phụ thu mà không ai gõ giờ (BR-414). "Vắng = giờ máy chủ" vi phạm điều này: QR tạo 12:40 trên căn có khách đến tự cộng 30 %.
- Ca QR vắng giờ lúc 09:00 (giờ chuẩn 12:00 còn ở tương lai) trả 422, không tạo QR. Chấp nhận được, vì chỉ Desk tạo QR trả phòng, và Desk luôn gửi giờ.
- `amountDueNow` lỗi 4xx thì trả số dư folio, chưa có phụ thu chưa ghi. An toàn cho khách.

### 2.4 Ứng viên "tối hôm trước" (C0313-07)

- **Đúng khi lễ tân gõ giờ.** Ví dụ T10-8: lúc 01:05 ngày đi, gõ 23:50 → 23:50 tối hôm trước, phụ thu 0, kèm ghi chú.
- **Sai khi dựng từ giờ hẹn hoặc giờ chuẩn.** Test "C0313-08" của PR ra 23/11 17:00 cho khách hẹn trả 17:00 ngày 24/11 mà đi lúc 01:00 ngày 24/11. Số tiền đúng (0), nhưng giờ sai ngày. Thẻ PR106-01.
- **Khách đi tối hôm trước, sáng hôm sau quầy mới biết.** Ca này không ghi được ngày đi thật. Ví dụ xe giường nằm Đà Lạt – Sài Gòn chạy 22:00–23:00; khách tự ra bằng mã cửa, không báo người trực. Thẻ PR106-02, đề xuất v1.0.6.

### 2.5 `allowedActions.check_out` từ 00:00 ngày đi, theo ngày đi hiệu lực (gồm đơn con gia hạn): đồng ý

Đúng BUG-R4-036 và BR-422. Dòng "Hôm nay" dùng cùng luật (`shared/business-day.ts`), nên nút ở hai màn không lệch nhau. T15-15 (đơn con còn hiệu lực) đúng ý DOM 7.1.

## 3. PR #99 – xác nhận giả định của BE-A2

| # | Giả định BE-A2 | DOM | Lý do |
|---|---|---|---|
| 1 | Giờ rời thật = `checkoutAt` (có thể sớm hơn lúc bấm), dùng cho `actual_checkout_at`, `touchLastStay`, đăng ký lưu trú `stay_ended_at` | **Đồng ý** | Khai báo ghi ngày lịch lúc khách đi (BR-010, BR-602). Mốc giữ hồ sơ tính từ lúc lượt ở thật sự kết thúc. Mốc sớm hơn vài giờ có lợi cho quyền riêng tư. ALOS (metrics) đếm "lượt kết thúc trong kỳ" theo ngày này, nên đúng hơn. B18 chỉ gửi `checkoutTime` thì xem thẻ PR99-02 |
| 2 | `post_checkout_window_until` vẫn tính từ lúc ghi | **Đồng ý** | Cửa sổ là thời gian quầy kiểm căn và ghi phát sinh sau khi folio đóng. Nó bắt đầu khi Desk đóng folio, không phải lúc khách đi. Trong lúc chờ, căn vẫn "Đang ở", không ai vào, nên chứng cứ vẫn thuộc lượt này |
| 3 | Tóm tắt có `nightsNotBilled` khi quá ngày | **Đồng ý** | FD đọc được để biết gọi ai: 1 đêm thì quản lý, từ 2 đêm thì chủ đầu tư. Máy chủ đếm lại lúc ghi: đọc lúc 05:50 thấy 1 đêm, ghi lúc 06:05 thành 2 đêm thì quản lý bị chặn đúng trần |
| 4 | Không ghi nhật ký đổi `checkout_time` trên đơn quá ngày | **Đồng ý, kèm điều kiện** | Audit `after.overdue` đã có `checkoutAt`, `recordedAt`, lý do. Lịch sử đơn (`rack.service.ts`) đọc audit, và khóa `overdue` đã vào allowlist. Ghi thêm dòng nhật ký chỉ lặp lại. Điều kiện: danh sách đóng ca (BR-526), khi làm, phải đọc cả ca quá ngày đi từ audit |
| 5 | Hoa hồng: `tryEarn` so `payment.created_at > actual_checkout_at` | **Không đồng ý → thẻ PR99-01 (Major)** | Mốc "tiền về sau trả phòng" phải là **lúc ghi Trả phòng**. Giờ rời thật không dùng được cho mốc này |
| 6 | Minibar trên đơn quá ngày: lần đếm có ngày nghiệp vụ ≥ ngày đi (`countFrom`) | **Đồng ý** | Đúng hợp đồng 1.4 và cùng mức chặt với K11-09 của đường thường. Gợi ý thêm ở thẻ PR99-03 |
| 7 | `overdueReason` thay ghi chú giờ; `extraNight`, `lateFeeInsteadOfNight` → `NOT_ALLOWED`; sau mốc cuối → `LATE_CHECKOUT_AFTER_LIMIT` ở `checkoutAt` | **Đồng ý** | Đúng DOM 7.1 và hợp đồng 1.4. Đêm khách ở thật đi B13 trước |

DOM xác nhận thêm hai điểm PR #99 làm mà hợp đồng chưa ghi rõ:
- **`checkoutAt` trong cửa sổ sau nửa đêm của ngày đi được nhận** trên đơn quá ngày đi (`resolveCheckoutAt` nhận `inPostMidnightWindow(c, dep)`). Ví dụ khách đi 03:00 sáng ngày đi: không phụ thu, không đêm thêm, khai báo ghi ngày đi. Đúng nghiệp vụ. Hợp đồng 1.4 ý 2 viết "ngày nghiệp vụ = ngày đi của lượt", nên ARC thêm "hoặc cửa sổ sau nửa đêm của ngày đó".
- **Phụ thu trả muộn trên đơn quá ngày đi:** `lateQuote` xét "căn có khách đến cùng ngày" theo ngày đi của lượt (đơn cuối của lượt), không theo ngày ghi. Đúng BR-412. Phụ thu tăng vẫn qua `applyLateSurcharge`, không có "bỏ qua" (BR-414). Còn nợ thì quản lý ghi công nợ như thường (BR-525).

## 4. Thẻ

### FB-R5-DOM-BE-PR106-01
- Mức độ: Minor
- Vị trí:
  - `product/services/api/src/modules/frontdesk/internal/checkout-at.ts` `resolveCheckoutAt`, nhánh không gửi `checkoutAt`: ứng viên `before` = (ngày đi − 1, `t`);
  - `checkout.service.ts` `resolveCheckoutAt`: `t = checkoutTime ?? agreed_checkout_time ?? checkout_time`;
  - `test/be-a1-v105-units.test.ts`, ca "C0313-08: nothing typed".
- Vấn đề:
  - Trong cửa sổ sau nửa đêm của ngày đi, khi không gõ giờ, mã dựng ứng viên "tối hôm trước" từ giờ hẹn hoặc giờ chuẩn. Ứng viên này thắng vì là ứng viên duy nhất không ở tương lai.
  - Test của PR: đi 24/11, hẹn trả 17:00, lúc 01:00 ngày 24/11, không gõ → `checkoutAt` = **23/11 17:00**. Khách thật sự đi lúc 01:00 ngày **24/11**.
  - Với giờ chuẩn: lúc 01:05 ngày đi, không gõ, khách nhận phòng từ trước → 12:00 trưa hôm trước, kèm `checkoutTimeNoteRequired`.
- Vì sao quan trọng:
  - Số tiền vẫn đúng (0), nhưng **giờ sai ngày**.
  - Hợp đồng bảo Desk gửi tiếp `checkoutAt` của tóm tắt (V5-10). PR #99 ghi giờ đó vào `actual_checkout_at` và `stay_ended_at`. Vậy khai báo lưu trú sẽ ghi ngày đi 23/11 thay vì 24/11 (BR-010, BR-602).
  - Giờ hẹn và giờ chuẩn theo định nghĩa là giờ của ngày đi. "Khách đi tối hôm trước" chỉ có khi lễ tân gõ.
  - Desk hiện điền giờ máy quầy, nên chưa gặp ca này. Nó sẽ xuất hiện nếu FE-A V5-10 lấy `checkoutAt` của tóm tắt lần đầu (chưa gửi giờ) làm giờ điền sẵn.
- Đề xuất sửa:
  - Chỉ dựng ứng viên (ngày đi − 1, `t`) khi `checkoutTime` được gõ. Cách ARC đã cho `checkoutAt` gửi lên vẫn giữ.
  - Không gõ giờ trong cửa sổ → chỉ còn (ngày đi, `t`), ở tương lai → `checkoutAtAfterNow = true`. Desk hỏi giờ (Desk đã điền giờ máy quầy).
  - Sửa test: 01:00 ngày 24/11, hẹn 17:00, không gõ → `afterNow = true`; gõ 01:00 → 24/11 01:00, `postMidnight = true`; T10-8 (gõ 23:50) giữ nguyên.
  - Hệ quả nhỏ: Desk v1.0.4 tạo QR cho ca "gõ 23:50 lúc 01:05" sẽ bị 422 tới khi FE-A V5-10 lên. Chấp nhận được, vì khách đã đi từ tối, không có mặt để quét QR.
- Trạng thái: Open

### FB-R5-DOM-BE-PR106-02
- Mức độ: Minor (đề xuất dời v1.0.6, cần ARC đổi hợp đồng ở 0.3.14)
- Vị trí: `checkout-at.ts` `eveningBeforeAllowed` (chỉ khi giờ máy chủ ở cửa sổ sau nửa đêm của ngày đi); hợp đồng 1.19 ý 07.
- Vấn đề:
  - Khách rời tối hôm trước ngày đi, quầy biết sau 06:00 sáng ngày đi.
  - Ví dụ: đơn đi 24/11. Khách đi xe đêm 22:30 ngày 23/11, không báo. 07:30 ngày 24/11 buồng phòng thấy căn trống.
  - Gửi `checkoutAt` 23/11 22:30 → 422 `DATE_INVALID`. Gõ 22:30 → ra 24/11 22:30 ở tương lai → 422.
  - Lễ tân chỉ ghi được giờ của ngày 24/11, nên khai báo lệch một ngày lịch. PR #99 có cùng giới hạn trên đơn quá ngày đi.
- Vì sao quan trọng:
  - Ca này dễ gặp ở Đà Lạt (đánh giá của DOM, chưa có số đếm; xe đêm đi Sài Gòn; khách tự ra vào bằng mã cửa, có lúc không có người ở quầy – BR-427).
  - Không có hệ quả tiền: đêm 23/11 đã bán, khách đã nhận căn đêm đó; phụ thu 0.
  - Có hệ quả pháp lý nhỏ: khai báo ghi sai ngày khách rời (BR-010, BR-602; câu hỏi luật sư ở BR mục 15).
- Đề xuất sửa:
  - v1.0.6: nhận `checkoutAt` có ngày nghiệp vụ = ngày đi − 1 bất cứ lúc nào B18 còn mở cho lượt (ngày đi nghiệp vụ, cửa sổ sau nửa đêm, và đường quá ngày đi của OWN/MGR).
  - Ba điều kiện:
    - không sớm hơn giờ nhận phòng thực tế;
    - không sớm hơn `checkin_time` của ngày đi − 1 (sớm hơn nữa là khách bỏ đêm cuối: đi Trả sớm B16, không đi B18);
    - phụ thu 0, bắt buộc ghi chú (đã có, vì giờ khai sớm hơn lúc bấm quá ngưỡng).
  - Tới v1.0.6: lễ tân ghi giờ sớm nhất nhận được của ngày đi, ghi chú "khách đi tối 23/11 lúc 22:30". BA thêm câu này vào sổ tay.
- Trạng thái: Open

### FB-R5-DOM-BE-PR99-01
- Mức độ: **Major** (sửa trước khi gộp PR #99)
- Vị trí:
  - `product/services/api/src/modules/folio/public/folio.service.ts` `tryEarnCommissions`, câu `AND r.actual_checkout_at IS NOT NULL AND p.created_at > r.actual_checkout_at` (trên `main`; PR #99 không đổi tệp này);
  - PR #99 `checkout.service.ts`, khối "state": `departedAt` ghi vào `actual_checkout_at` **trước** `tryEarnCommissions` trong cùng giao dịch.
- Vấn đề:
  - `tryEarn` giữ mọi hoa hồng của đơn khi có khoản thu `pending`/`disputed` tạo sau `actual_checkout_at`. Luật DOM 18/10 nhắm vào tiền về **sau khi ghi Trả phòng**: thu nợ, phát sinh sau trả phòng.
  - PR #99 đặt `actual_checkout_at` = `checkoutAt`, luôn sớm hơn lúc bấm. FE V5-10 gửi `checkoutAt` của lần tóm tắt, và lần tóm tắt luôn đọc trước khi thu tiền.
  - Vì vậy mọi khoản VietQR hay chuyển khoản thu **trong** lúc trả phòng (`reconciliationFor` → `pending`) bị tính là "sau trả phòng". Kể cả `finalPayment` ghi trong chính lệnh B18, có `created_at` = `ctx.now` > `checkoutAt`.
  - Ví dụ: đơn CTV căn 202. Mở Trả phòng 11:58 (`checkoutAt` 11:58), khách quét VietQR, lễ tân ghi tiền 12:01, Trả phòng 12:03.
    - v1.0.4: `actual_checkout_at` 12:03 → hoa hồng "đạt" 12:03.
    - PR #99: `actual_checkout_at` 11:58 → khoản 12:01 > 11:58, đang chờ đối soát → hoa hồng ở "dự kiến" tới khi đối soát.
  - Đơn quá ngày đi: khách đi 23/11 11:00, chuyển phần còn lại 23/11 15:00 (lễ tân ghi), quản lý ghi Trả phòng 24/11 09:00. Hoa hồng bị giữ dù khoản 15:00 ghi trước khi đóng folio.
- Vì sao quan trọng:
  - Sai luật BR-903. Ví dụ của BR-903 ghi "đơn do lễ tân thu toàn bộ → đạt lúc trả phòng". Chỉ khoản do chính người hưởng ghi mới phải đối soát mọi lúc (BR-527).
  - Ở OTTIMO, khách trực tiếp chủ yếu trả VietQR, nên gần như mọi đơn có sale hoặc CTV bị dời ngày "đạt".
  - Trả phòng ngày cuối tháng mà đối soát sang ngày đầu tháng sau thì hoa hồng có thể sang kỳ chi sau (lịch chi theo tháng, BR-212). Không mất tiền, nhưng sai kỳ lương của sale và CTV, trước kỳ chốt 01/12.
- Đề xuất sửa:
  - Đổi mốc trong `tryEarn` sang **lúc ghi B18**. Có hai cột sẵn, không cần migration; ARC chọn:
    - `folio.settled_at` (B18 đặt trong cùng giao dịch, trước `tryEarn`), nếu cột này không đổi sau B18;
    - hoặc `occurred_at` của `state_transition` B18 của đơn chính.
  - Giữ nguyên điều kiện thứ hai: khoản do người hưởng ghi còn `pending`/`disputed`, bất kể lúc nào.
  - Test thêm:
    1. Ca 11:58 / 12:01 / 12:03 ở trên → `earned` lúc B18.
    2. Thu nợ chuyển khoản sau B18 → giữ tới đối soát, như hiện nay.
    3. Đơn quá ngày đi, khoản lễ tân ghi giữa giờ rời thật và lúc ghi → `earned` lúc B18.
    4. Khoản do CTV ghi, chưa đối soát → vẫn giữ.
  - Luật: rules-v1.0.5 mục 15.5.
- Trạng thái: Open

### FB-R5-DOM-BE-PR99-02
- Mức độ: Minor
- Vị trí: PR #99 `checkout.service.ts`, `const departedAt = d.checkout.sent ? d.checkout.at : ctx.now;`
- Vấn đề:
  - B18 chỉ gửi `checkoutTime` thì phí trả muộn tính theo giờ gõ (`d.checkout.at`), còn đơn, đăng ký lưu trú và hồ sơ khách ghi lúc bấm. Desk v1.0.4 đang gửi đúng kiểu này.
  - Ví dụ: bấm 12:45, gõ 12:10, có ghi chú → phí theo 12:10, khai báo ghi 12:45.
  - Một lần trả phòng có hai "giờ rời".
- Vì sao quan trọng:
  - Luật DOM: giờ rời thật là giờ lễ tân khai, đã qua kiểm dung sai và ghi chú. Gửi bằng trường nào cũng vậy.
  - Hết lệch khi FE-A V5-10 luôn gửi `checkoutAt`. Nhưng trong khoảng giữa hai lần gộp, và với mọi client chỉ gửi giờ, khai báo lấy sai giờ.
- Đề xuất sửa:
  - `departedAt = d.checkout.at` cho mọi B18. `readInput` đã bắt buộc có `checkoutTime` hoặc `checkoutAt`, nên `d.checkout.at` luôn là giờ người ghi khai.
  - ARC sửa câu 1.18 "mọi B18 có `checkoutAt`" thành "mọi B18".
  - ARC giữ câu cũ thì FE-A V5-10 phải luôn gửi `checkoutAt`, và QA thêm ca kiểm (rules 15.6, ca T-15-22).
- Trạng thái: Open

### FB-R5-DOM-BE-PR99-03
- Mức độ: Suggestion (v1.0.6)
- Vị trí: `inventory/public/minibar-checkout.port.ts` `fridgeState` (`window.countFrom`), `frontdesk/public/ports.ts` `MinibarCountWindow`.
- Vấn đề:
  - Trên đơn quá ngày đi, lần đếm cuối có ngày nghiệp vụ ≥ ngày đi thì được tính, kể cả khi đếm **trước** giờ khách rời.
  - Ví dụ: đếm 09:00 ngày đi, khách dùng thêm rồi đi 11:00 → phần dùng sau 09:00 không vào bill.
  - Đường thường (K11-09, "đếm hôm nay") cũng có khe này. Nhưng đơn quá ngày đi luôn có người vào căn **sau** khi khách đi, nên có thể đòi lần đếm đúng lúc.
- Vì sao quan trọng: tiền minibar nhỏ, nhưng đây là chỗ thất thoát dễ chặn.
- Đề xuất sửa:
  - v1.0.6: cổng trả thêm cờ "lần đếm cuối trước `checkoutAt`".
  - Desk hiện một dòng "Lần đếm tủ trước giờ khách rời – đếm lại?" (UXD viết chữ). Không chặn máy chủ.
  - Tới đó: sổ tay ghi "đơn quá ngày đi: đếm tủ khi vào căn phát hiện khách đã đi" (BA).
- Trạng thái: Open

## 5. Ghi chú cho vai khác (không phải thẻ BE)

- **FE-A (V5-10):**
  - Giờ trả điền sẵn vẫn là giờ máy quầy (KB7). **Không** lấy `checkoutAt` của tóm tắt lần đầu (chưa gửi giờ) làm giờ điền sẵn: đó là giờ hẹn hoặc 12:00, và làm mất phụ thu sau 12:30 như BUG-R2-084.
  - QR và B18 mang `checkoutAt` của lần tóm tắt cuối có gửi giờ.
  - Đơn quá ngày đi mà người xem là FD/FDL (không có `allowedActions.overdue`): hiện chỉ dẫn theo `nightsNotBilled`: "Quá 1 đêm: cần quản lý trả phòng." hoặc "Quá {n} đêm: cần chủ đầu tư trả phòng." (chữ do UXD chốt).
- **UXD:**
  - Một dòng nhắc cạnh ô giờ trả, khi giờ còn là giờ Desk tự điền và có phụ thu > 0, ví dụ "Giờ trả là lúc khách trả chìa. Khách đã đi trước thì sửa giờ."
  - Chữ cho thẻ PR99-03 ở v1.0.6.
- **BA:** sổ tay lễ tân và quản lý có ba điều: giờ rời thật (15.1), không rõ giờ (15.3), khách đi tối hôm trước (thẻ PR106-02).
- **ARC:**
  - Hợp đồng 1.4 ý 2: thêm cửa sổ sau nửa đêm của ngày đi.
  - Quyết thẻ PR99-01 (cột mốc), PR99-02 (câu 1.18), PR106-01. PR106-02 đưa vào 0.3.14.
- **SEC:** DOM đồng ý thẻ FB-R5-SEC-BE-A1A-01 (`rounds/round-05/reviews/SEC-on-be-prs-106-99-checkout.md`): giờ rời gửi lên không được sớm hơn giờ nhận phòng thật, ở mọi nhánh. Về nghiệp vụ, khách không thể rời trước khi tới; khai báo đi trước giờ đến là dữ liệu pháp lý sai.
- **SEC (để biết):** đơn quá ngày đi nhiều đêm (chỉ chủ đầu tư) có mốc giữ ảnh giấy tờ tính từ `checkoutAt`. Nếu số đêm quá ngày ≥ số ngày giữ ảnh, ảnh có thể tới hạn xóa ngay lúc ghi, trong khi cửa sổ ghi phát sinh mới bắt đầu. Ca hiếm. Có tranh chấp thì dùng `legal_hold` như hiện nay. DOM không đề nghị đổi.
- **QA:** ca T-10-11 … T-10-14 và T-15-21 … T-15-25 ở rules 15.6.
- **DOM (việc của mình):** BR bản kế tiếp (v0.5.15) sửa câu BR-414 "ô giờ … mặc định = giờ chuẩn": phần trả phòng đổi thành giờ máy quầy (quyết định 17/10), phần nhận phòng giữ. Thêm luật 15.1, 15.3, 15.5 vào BR-412, BR-414, BR-903.

## 6. Dòng đề xuất ghi `decision-log.md` (ORC ghi khi commit)

`| 2026-11-07 | 5 | **DOM – review nghiệp vụ PR #106 (V5-10) và PR #99 (V5-15)** (rounds/round-05/reviews/DOM-on-be-prs-106-99-checkout.md; rules-v1.0.5 mục 15): #106 ĐẠT, #99 ĐẠT CÓ ĐIỀU KIỆN (FB-R5-DOM-BE-PR99-01 Major: mốc "tiền về sau trả phòng" của hoa hồng = lúc ghi B18 (folio.settled_at hoặc transition B18), không phải actual_checkout_at). Luật: phí trả muộn, khai báo, mốc giữ chứng cứ theo giờ khách rời thật, lúc bấm chỉ để kiểm dung sai 30 phút; Desk điền giờ máy quầy, máy chủ vắng giờ lấy giờ hẹn ?? giờ chuẩn; "tối hôm trước" chỉ khi lễ tân gõ; không rõ giờ → 12:00 không phụ thu trừ khi có bằng chứng; đơn quá ngày đi nhận checkoutAt cả cửa sổ sau nửa đêm của ngày đi | DOM | Quyền DOM (đúng nghiệp vụ); không đổi số của INV |`

## 7. Điểm làm tốt

- `resolveCheckoutAt` là hàm thuần, một chỗ, có test theo từng ca của hợp đồng. Tóm tắt, QR và B18 không còn lệch nhau, đúng gốc của BUG-R4-051.
- `nightsNotBilled` đếm theo lúc bấm, không theo `checkoutAt`, và cổng vai chạy trước thân lệnh. Người ghi không tự chọn được mức trần, đúng điều DOM 7.1 cần.
- Đơn quá ngày đi không có đường thêm đêm hay phụ thu thay đêm; đêm khách ở thật vẫn đi B13. Một lệnh làm một việc, báo cáo đêm bán không bị lẫn.
