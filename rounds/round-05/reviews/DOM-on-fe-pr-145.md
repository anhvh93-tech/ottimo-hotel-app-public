# DOM review – FE PR #145 (V5-15 Desk: Trả phòng quá ngày đi)

- Người review: DOM | Round 5 – bước Review (nghiệp vụ, góc quầy và quản lý của căn hộ dịch vụ 10 căn) | Ngày: 07/11/2026
- Đối tượng: **#145**, nhánh `r5-fe-v5-15-overdue` @ `011d44e7` (FE-A2).
  - Nội dung V5-15 nằm ở `9660334e`. Hai commit còn lại chỉ là merge: `7900a5fe` (nhánh #140 @ `1a422157`) và `011d44e7` (main @ `2eba9847`).
  - Báo cáo FE: `rounds/round-05/outputs/FE/v5-15-overdue-fea.md` (trong PR).
- Đối chiếu:
  - luật DOM: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 7.1, 15.2, 15.3, 15.4, 15.6;
  - BR-010, BR-412, BR-414, BR-421, BR-433, BR-525, BR-602 (`product/docs/business-rules.md` v0.5.15);
  - từ điển tham số bản 1.5 (`product/docs/tham-so-quy-tac.md`): `checkout_time`, `late_grace_until`, `late_checkout_tiers`, `business_day_rollover`, `manual_time_tolerance_minutes`;
  - hợp đồng 0.3.13 bổ sung 1, mục 1.4, 1.18, 1.19;
  - máy chủ trên `main` (#99, #135): `frontdesk/internal/checkout-at.ts` (`resolveCheckoutAt`), `reservations/public/overdue-checkout.ts`, `reservations/internal/allowed-actions.ts`, `frontdesk/internal/checkout.service.ts` (tóm tắt, B18, VietQR), `frontdesk/internal/stay.service.ts` (B15).
- Cách đọc:
  - `gh pr view 145`, `git show`, cây làm việc tạm ở scratchpad tại `011d44e7`;
  - không commit, không đẩy gì lên nhánh PR;
  - DOM chạy hàm thuần `resolveCheckoutAt` của máy chủ với 6 ca (mục 3.1).
- CI lúc review (`gh pr checks 145`): mọi job chạy đều xanh, gồm `format · lint · audit · test · build` và `docker images build · E2E smoke`. Các job deploy được bỏ qua, đúng với một PR.
- Không có dữ liệu khách. Giá 700.000 và các mức phụ thu là số ví dụ của BR-412.

Ký hiệu: **D** là ngày đi hiệu lực của lượt (`stayDepartureDate`). Ngày nghiệp vụ D chạy từ 06:00 ngày D tới 05:59 ngày D+1 (BR-010, `business_day_rollover` = 06:00).

## 1. Kết luận

**#145 @ `011d44e7`: DUYỆT CÓ ĐIỀU KIỆN.**

- **Điều kiện gộp:** sửa **FB-R5-DOM-FE-145-01 (Major)** ngay trong PR này, kèm 1 ca vitest.
  - Lỗi: khi đơn có giờ hẹn trả muộn, dòng nhắc dưới ô giờ bảo ghi giờ chuẩn. Làm theo thì phụ thu đã thỏa thuận bị đảo mà không có bằng chứng.
  - 10 khóa chữ mới của FE-A2 còn chờ UXD duyệt, nên sửa cùng lượt đó.
  - Sửa xong, DOM chỉ xem phần thay đổi rồi chuyển DUYỆT.
- **Trả lời nghiệp vụ cho FB-R5-FE-ARC-V515-01 (chi tiết ở mục 3):**
  - **Không bắt buộc ở v1.0.5.** Ca này cần hai lỗi cùng lúc, và cách tạm cho ra đúng số tiền. Giữ mức Minor, sửa trong v1.0.6 (ARC chọn cách làm). Nếu ARC thấy rẻ thì làm sớm hơn, nghiệp vụ không chặn.
  - **Tới lúc sửa:** ghi **06:00 ngày đi**. Lý do ghi giờ thật, ví dụ "Khách đi 03:00 sáng 10/11, ...". Không gõ 05:59 hay 05:30. Không gia hạn.
  - **Tiền của cách tạm:** đúng. Số đêm không thu, phụ thu trả muộn (0), đêm thêm (không có), ngày khai báo lưu trú, mốc kiểm căn sau trả phòng và hoa hồng đều như khi ghi 03:00. Chỉ giờ trên đăng ký lưu trú lệch tối đa 6 tiếng, cùng ngày lịch.
  - **Luật cho bản sửa:** trên đơn quá ngày đi, giờ gõ trước mốc đổi ngày là rạng sáng của chính ngày đi. Kèm 3 điều kiện ở mục 3.5.
- **Phần còn lại đúng nghiệp vụ** (mục 2):
  - ai được ghi do máy chủ quyết;
  - chỉ dẫn gọi ai;
  - ba lý do gợi ý;
  - không có đêm thêm, không có phụ thu một đêm trên đường quá ngày đi;
  - số cần thu trước và sau mốc cuối;
  - hộp xác nhận ghi giờ và ngày khách rời.
- **Luật DOM bổ sung** (mục 4): đơn có giờ hẹn trả muộn mà không có bằng chứng giờ rời → ghi giờ hẹn, phụ thu đã thỏa thuận giữ nguyên. Đây là căn cứ của thẻ 01. DOM ghi vào `rules-v1.0.5.md` 15.3 ở lượt sửa kế tiếp.
- **Thẻ khác** (không chặn gộp):
  - 02 Minor: chữ khi gõ giờ trước 06:00;
  - 03 Minor: chỉ dẫn cho FD/FDL thiếu nhánh "Gia hạn";
  - 04, 05 Suggestion.
- **Không có ESC.** Mọi điểm thuộc quyền DOM (đúng nghiệp vụ), UXD (chữ), FE hoặc ARC (kỹ thuật). Không đổi con số nào của INV.

## 2. Kiểm theo các điểm ORC giao

| # | Điểm kiểm | Mã #145 | Kết quả |
|---|---|---|---|
| 1 | **Lý do** – thực tế ở 10 căn | 3 nút (`Seg`): "Khách đi không báo", "Lễ tân quên bấm Trả phòng" điền chữ vào ô; "Khác (ghi rõ)" xóa ô và đưa con trỏ vào ô. Ô bắt buộc, 3–500 ký tự, máy chủ nhận chữ tự do. Help D12c luôn hiện | **Đạt.** Đúng 7.1 ý 1. Ở OTTIMO khách tự ra vào bằng mã cửa, nên "đi không báo" là ca nhiều nhất, sau đó là "quên bấm" lúc giao ca. Mất mạng lúc trả phòng hay khách đi trước giờ quầy mở thì vào "Khác". Ba nút là đủ. Chữ gợi ý theo ngôn ngữ đang dùng trên Desk: chấp nhận, vì lý do là chữ tự do và chủ đầu tư đọc được cả hai. Lý do đang ngắn quá với việc hậu kiểm: thẻ 04 |
| 2 | **Gọi ai** | Máy chủ chỉ mời `check_out` kèm `overdue: true` cho OWN, và cho MGR khi `nightsNotBilled` ≤ 1. Không có cờ đó: màn chỉ dẫn (`need_manager` cho 1 đêm, `need_owner` từ 2 đêm), không có bước nào. B18 trả 403 `requiredRole: owner` → câu need_owner, `{n}` lấy từ 403. Ngăn đơn: nút "Trả phòng" bị khóa, cạnh nút có câu | **Đạt.** Đúng 7.1 (a), ESC-007 A, BR-433. Desk không tự đoán theo vai. Mở trang từ tối hôm trước rồi qua đêm thứ 2 vẫn ra đúng người. Ở 10 căn, quản lý và chủ đầu tư làm được trên điện thoại. Còn thiếu nhánh lễ tân tự làm được: khách còn ở hoặc đã ở thêm thì Gia hạn (thẻ 03) |
| 3 | **Giờ điền sẵn** | Lần tóm tắt đầu (chưa gửi giờ): `checkoutTime` của máy chủ = giờ hẹn trả muộn, không có thì giờ chuẩn. Không lấy giờ máy quầy. Không có viền "giờ Desk tự điền" | **Đạt** về giá trị điền. Trên đơn quá ngày đi, giờ máy quầy không có nghĩa gì: máy chủ đọc nó thành cùng giờ đó của ngày đi. Bấm 09:00 ngày 11/11 thì thành 10/11 09:00, một giờ không ai thấy. Bấm 19:30 thì thành 10/11 19:30, quá mốc cuối. Giá trị FE-A2 điền khớp 15.2 (máy chủ không nhận giờ nào → giờ hẹn hoặc giờ chuẩn) và 15.3. **Chưa đạt** ở dòng nhắc khi có giờ hẹn (thẻ 01, mục 4) |
| 4 | **Tiền trước mốc cuối** | Phụ thu theo giờ gõ, luồng cũ giữ nguyên: dòng "Phụ thu trả muộn", tick "Tôi đã báo khách khoản phụ thu này", FOC, B15 trước bước bill. Số cần thu là `amountDueAtCheckoutVnd` của máy chủ. Ẩn "Trả đúng giờ" và gợi ý "dùng Trả muộn" | **Đạt.** Đúng 15.4 ý 3: phụ thu tăng vẫn phải chọn ghi, "căn có khách đến cùng ngày" xét theo ngày đi (máy chủ), còn nợ thì quản lý ghi công nợ ở bước bill. Ẩn hai dòng gợi ý là đúng, vì khách đã đi. Bộ test chưa có ca tiền nào trên đường quá ngày đi (mục 6: T-15-26, T-15-27). Chữ ô tick: thẻ 05 |
| 5 | **Tiền sau mốc cuối** | `extraNightRequired` trên đơn quá ngày đi, hoặc 422 `LATE_CHECKOUT_AFTER_LIMIT`: câu "gia hạn trước" dưới ô giờ; ẩn dòng phụ thu; không có ô giá đêm thêm, không có phụ thu một đêm; "Tiếp tục" khóa. Số cần thu là `balanceDueVnd` | **Đạt.** Đúng hợp đồng 1.4 và BR-412: sau 18:00 là ở thêm 1 đêm, đi Gia hạn B13 trước. Số hiện ra là số dư folio hiện có, không cộng đêm nào. Nút khóa nên không thu được gì ở đây, cũng không đóng folio thiếu đêm. Thân B18 không mang `extraNight`, `lateFeeInsteadOfNight`. Máy chủ cũng chặn (422) |
| 6 | **Không có đường hụt một đêm mà không ai biết** | Xem dưới bảng | **Đạt** |

Các đường DOM đã xét cho điểm 6:
- FD, FDL không ghi được: máy chủ không mời `check_out` (403 nếu gọi thẳng), Desk khóa nút ở cả trang và ngăn đơn.
- Quản lý chỉ bỏ được 1 đêm. Từ 2 đêm chỉ chủ đầu tư làm được. Số đêm do máy chủ đếm theo lúc bấm, không theo giờ người ghi khai (7.1).
- Mỗi lần ghi phải có lý do. Audit `after.overdue` ghi `nightsNotBilled`, hai giờ và lý do. Chủ đầu tư xem lại bằng bộ lọc "Trả phòng quá ngày đi – tuần này".
- Đường quá ngày đi không thêm đêm. Giờ sau mốc cuối bị từ chối, không có lối "ghi phụ thu thay đêm".
- Hộp ở mọi bước nhắc "Khách ở thêm đêm nào thì gia hạn trước". Hộp xác nhận ghi rõ giờ và **ngày** khách rời.
- Không có Trả sớm (B16) trên đơn quá ngày đi (`earlyDepartureOpen` của máy chủ).
- Đếm minibar lúc vào căn vẫn được tính (15.4 ý 7, BE C0313-10).
- Cách tạm của V515-01 không đổi số đêm hay số tiền nào (mục 3.4).

Rủi ro còn lại: quản lý ở xa nghe lễ tân báo "căn còn Đang ở", chọn "Lễ tân quên bấm" và ghi 12:00, trong khi khách thật ra đã ở thêm đêm đó. Ca này không im lặng (audit, hậu kiểm, giới hạn 1 đêm). Thẻ 03 đưa câu hỏi "khách còn ở không" về đúng người đứng ở quầy.

## 3. FB-R5-FE-ARC-V515-01 – trả lời phía nghiệp vụ

### 3.1 DOM tái hiện bằng hàm của máy chủ

Đơn đi D = 10/11, nhận phòng 08/11 14:00, mốc đổi ngày 06:00, dung sai 30 phút. Chạy `resolveCheckoutAt` (bản trên `main`) bằng `tsx`:

| Lúc bấm (giờ máy chủ) | Giờ gõ | Máy chủ quy về | Ghi chú |
|---|---|---|---|
| 11/11 09:00 (quá ngày đi 1 đêm) | 03:00 | **11/11 03:00** | Sau mốc cuối của ngày đi → tóm tắt báo `extraNightRequired`, Desk hiện "gia hạn trước", nút khóa. **Đúng như FE-A2 báo** |
| 11/11 09:00 | 05:59 | 11/11 05:59 | Như trên |
| 11/11 09:00 | **06:00** | **10/11 06:00** | Ngày nghiệp vụ = D. Không phụ thu, không đêm thêm |
| 10/11 09:00 (đường thường, ngày đi) | 03:00 | 10/11 03:00, `postMidnight` | Đúng 15.4 ý 2. Ca này **chỉ hỏng trên đường quá ngày đi** |
| 11/11 05:00 (sau nửa đêm của D+1, ngày nghiệp vụ vẫn là D) | 03:00 | 11/11 03:00 | Đường thường. Trước #145, không đổi. Lúc 05:00, "03:00" hiểu là hai tiếng trước là hợp lý |
| 11/11 09:00, Desk **gửi** `checkoutAt` = 10/11 03:00 | – | nhận, `postMidnight` | Hợp đồng 1.4 ý 2 đã đúng. Chỉ phần quy đổi từ giờ gõ là chọn sai ứng viên |

### 3.2 Ca 15.4 ý 2 có phải ghi được ở v1.0.5 không – **Không**

- Ca này cần **hai lỗi cùng lúc**:
  - khách rời căn trong 00:00–05:59 của ngày đi (xe sớm, chuyến bay sớm ở Liên Khương);
  - **cả ngày nghiệp vụ đi** (06:00 ngày D tới 05:59 ngày D+1) không ai bấm Trả phòng.

  Trong ngày đi, đường thường ghi 03:00 đúng (dòng 4 bảng trên). Ở 10 căn có buồng phòng vào căn mỗi ngày, ca kép này hiếm.
- Cách tạm cho ra đúng số tiền (mục 3.4). Không ai mất tiền, khách không bị tính oan.
- Cách sửa FE-A2 đề xuất đụng tới `resolveCheckoutAt`, hàm chung của tóm tắt, VietQR và B18. Hàm này mới ổn định sau V5-10. Không đáng làm vội trước tag chỉ vì một ca hiếm.
- **Mức:** giữ **Minor**. Đích **v1.0.6** (ARC đưa vào danh sách 0.3.14 cùng PR106-02). ARC thấy rẻ và an toàn thì làm ở v1.0.5. Nghiệp vụ không chặn.

### 3.3 Lễ tân, quản lý làm gì tới khi sửa

Ca: khách đi 03:00 sáng ngày đi 10/11, không ai bấm Trả phòng, 09:00 ngày 11/11 quản lý mới biết.

1. Quản lý mở Trả phòng. Ô giờ gõ **06:00** (đúng mốc đổi ngày; không gõ 05:59 hay 05:30, vì Desk sẽ hiểu là rạng sáng 11/11).
2. Ô lý do ghi giờ thật và cách biết, ví dụ: "Khách đi 03:00 sáng 10/11, báo qua Zalo lúc 03:05".
3. Hộp xác nhận phải ghi "06:00 ngày 10/11". Ngày khác 10/11 thì quay lại.
4. **Không gia hạn.** Câu "Giờ này quá mốc trả muộn… gia hạn trước" ở ca này là do Desk hiểu sai giờ, không phải khách ở thêm. Gia hạn là tính khách một đêm không ở.

Ai làm gì:
- BA đưa 4 bước trên vào sổ tay, mục trả phòng quá ngày đi, cạnh 15.3 ý 5 ("khách đi tối hôm trước"). Hai ca dùng chung một cách: ghi giờ sớm nhất Desk nhận của ngày đi, ghi giờ thật vào lý do.
- ORC đưa một dòng vào release notes v1.0.5.
- Thẻ 02 đưa câu này lên màn, ngay lúc gõ giờ.

### 3.4 Tiền và dữ liệu của cách tạm

| Hạng mục | Ghi 03:00 ngày 10/11 (đúng) | Ghi 06:00 ngày 10/11 (tạm) | Khác? |
|---|---|---|---|
| `nightsNotBilled` | 1 (đếm theo lúc bấm 11/11 09:00) | 1 | Không – không bao giờ đếm theo `checkoutAt` (7.1) |
| Phụ thu trả muộn | 0 (cửa sổ sau nửa đêm của ngày đi) | 0 (06:00 trước 12:00, BR-412) | Không |
| Đêm thêm | Không | Không | Không |
| Phụ thu đã hẹn (nếu có B15) | Tự giảm về 0 (có bằng chứng đi sớm, BR-412) | Tự giảm về 0 | Không |
| Ngày khai báo lưu trú (BR-010, BR-602) | 10/11 | 10/11 | Không – cùng ngày lịch |
| Giờ trên đăng ký lưu trú, hồ sơ khách | 03:00 | 06:00 | Lệch giờ, cùng ngày. Giờ thật nằm ở lý do trong audit |
| `post_checkout_window_until`, hoa hồng "đạt", danh sách đóng ca | Tính từ lúc ghi (15.4 ý 4, 15.5) | Như nhau | Không |
| Minibar | Lần đếm có ngày nghiệp vụ ≥ ngày đi | Như nhau | Không |

**Kết luận: cách tạm đúng tiền.** Chỉ có giờ trên đăng ký lưu trú là lệch. Câu hỏi luật sư ở BR mục 18 (cách ghi trễ ngày đi thật trên cổng khai báo) vẫn giữ. Lệch giờ trong cùng ngày không thêm câu hỏi mới.

### 3.5 Luật nghiệp vụ cho bản sửa (ARC chọn cách làm)

**Luật:** trên đơn quá ngày đi, giờ gõ trước `business_day_rollover` là **rạng sáng của chính ngày đi D** (cửa sổ sau nửa đêm của D), không phải rạng sáng D+1.

Lý do:
- Trên đường này, cách hiểu "rạng sáng D+1" không bao giờ ghi được: nó sau mốc cuối của ngày đi, nên bị từ chối. Cách hiểu duy nhất ghi được là D.
- Khách rời lúc rạng sáng D+1 tức là đã ở đêm D. Theo BR-412, BR-421, phải gia hạn trước. Sau gia hạn, ngày đi mới là D+1, và 03:00 ngày D+1 là cửa sổ sau nửa đêm của ngày đi mới. Luật trên vẫn cho kết quả đúng.
- Chọn theo "ứng viên muộn nhất không sau lúc bấm" chỉ đúng khi lễ tân ghi ngay lúc khách đi (đường thường). Trên đơn quá ngày đi, mọi ứng viên đều đã qua, nên quy tắc đó mất nghĩa.

Ba điều kiện để bản sửa không mở đường hụt đêm:
1. Hộp xác nhận vẫn ghi **ngày** của `checkoutAt` (`checkout.overdue_effect` đã có). Quản lý định ghi "03:00 sáng 11/11" sẽ thấy "ngày 10/11" và dừng lại.
2. Dòng nhắc dưới ô giờ nói rõ cách Desk đọc giờ: "giờ trước 06:00 là rạng sáng ngày {D}".
3. Trên đơn quá ngày đi, **không hiện** `checkout.post_midnight`. Câu này nói "trả phòng bây giờ không phụ thu", mà "bây giờ" đã là ngày sau. Máy chủ trả `postMidnightWindow: true` khi `checkoutAt` nằm trong cửa sổ đó, nên sau khi sửa, ca 03:00 ngày D sẽ bật câu này.

QA sau khi sửa: chạy T-15-23 trên Desk (MGR, gõ 03:00 → 200, `stay_ended_at` = 10/11 03:00, phụ thu 0, không đêm thêm, không có câu `post_midnight`).

## 4. Luật DOM bổ sung – giờ điền sẵn khi có giờ hẹn trả muộn (rules 15.3, ý 2a mới)

15.3 ý 2 viết cho đơn không có giờ hẹn: "không có bằng chứng → ghi 12:00 (hoặc giờ thấy căn trống nếu sớm hơn), không phụ thu". Chưa nói ca đơn có giờ hẹn trả muộn (B15). DOM chốt (NGÀNH, quyền DOM):

- **Đơn có giờ hẹn trả muộn, không có bằng chứng giờ rời** → ghi **giờ hẹn**. Dòng phụ thu đã ghi lúc hẹn (B15) **giữ nguyên**.
  - Lý do: khách đã xin và đồng ý mức phụ thu. Căn được giữ tới giờ đó. Buồng phòng chờ tới giờ đó mới vào. Căn có khách đến cùng ngày thì có khi đã phải xếp lại.
  - Đây là cùng luật máy chủ đã dùng khi không nhận giờ nào (15.2, hợp đồng 1.19), và là giá trị FE-A2 điền sẵn.
- **Có bằng chứng khách đi sớm hơn** (trả chìa, tin nhắn, buồng phòng thấy căn trống trước giờ hẹn) → ghi giờ đó. Phụ thu tự giảm theo BR-412 ("giảm thì hệ thống tự làm"), Desk hiện `checkout.late_recalc`.
- Gộp chung cho mọi đơn: ghi **giờ sớm hơn** trong hai giờ sau: (giờ hẹn, hoặc giờ chuẩn nếu không hẹn) và giờ thấy căn trống.
- Không đổi: chỉ ghi giờ **sau** giờ hẹn hoặc sau ân hạn (phụ thu tăng) khi có bằng chứng khách còn ở sau giờ đó (15.3 ý 3, BR-414).

Ví dụ: căn 202, giá đêm cuối 700.000, không có khách đến cùng ngày, hẹn trả 17:00 (đã ghi 350.000, 50 %), lượt quá ngày đi 1 đêm.

| Ca | Giờ ghi | Phụ thu | Khác với dòng đã ghi |
|---|---|---|---|
| Không có bằng chứng | 17:00 | 350.000 | 0 |
| Buồng phòng thấy căn trống 14:00 | 14:00 | 210.000 (30 %) | −140.000, tự giảm |
| Khách nhắn đã đi 12:20 | 12:20 | 0 (trong ân hạn 12:30) | −350.000, tự giảm |
| Nhân viên gặp khách trong căn 17:40 | 17:40 | 350.000 (bậc 15:00–18:00 vẫn 50 %) | 0 |
| Không hẹn, không có bằng chứng | 12:00 | 0 | – |

Phụ thu chưa thu mà khách đã đi: quản lý ghi công nợ ở bước bill (BR-525). Khách OTA: phụ thu vẫn thu trực tiếp theo BR-415 (chính sách đã đăng trên OTA, cơ sở là giá Trực tiếp). Khách đã đi thì nhắn bill qua tin nhắn của kênh.

DOM ghi ý 2a này vào `rules-v1.0.5.md` 15.3 và BR-412 (ví dụ) ở lượt sửa kế tiếp. Không đổi con số nào của INV.

## 5. Thẻ feedback

### FB-R5-DOM-FE-145-01
- Mức độ: Major
- Vị trí: `CheckOutPage.tsx`, bước 2, `timeHelp` (khóa `co.time_from_late` rồi tới `checkout.overdue_time_help`); chữ `checkout.overdue_time_help` trong `gen_strings.py`.
- Vấn đề:
  - Đơn có giờ hẹn 17:00 thì ô giờ điền sẵn 17:00. Đúng như vậy (mục 4).
  - Nhưng dưới ô, Desk hiện liền hai câu: "Theo giờ trả muộn đã hẹn 17:00. Giờ khách rời căn, ngày 10/11. Không có bằng chứng giờ: ghi 12:00 (giờ trả chuẩn) hoặc giờ thấy căn trống nếu sớm hơn, không phụ thu."
  - Câu sau bảo quản lý đổi 17:00 thành 12:00. Làm theo thì máy chủ tự đảo dòng 350.000 đã thỏa thuận. Nếu khách đã trả, folio thành dư tiền phải hoàn cho một khách đã đi, mà không có bằng chứng nào.
- Vì sao quan trọng: đây là câu hướng dẫn trên màn dẫn tới sai tiền (mất phụ thu đã thỏa thuận, mỗi lần 30–50 % giá một đêm), và trái luật mục 4. Màn lại đang nói hai điều trái nhau, quản lý không biết theo câu nào.
- Đề xuất sửa:
  - Tách dòng nhắc theo `r.agreedCheckoutTime`:
    - **không hẹn:** giữ câu hiện tại;
    - **có hẹn:** câu mới, UXD chốt chữ. Nghĩa: "Không có bằng chứng giờ: giữ {agreed} (giờ trả muộn đã hẹn). Khách đi sớm hơn – trả chìa, nhắn tin, buồng phòng thấy căn trống – thì ghi giờ đó."
  - Trên đơn quá ngày đi có hẹn, có thể bỏ `co.time_from_late` để không lặp. UXD quyết.
  - Thêm 1 ca vitest: đơn quá ngày đi, hẹn 17:00 → ô 17:00, không có câu "ghi {giờ chuẩn}". Đổi 14:00 → hiện `checkout.late_recalc` 350.000 → 210.000, không đòi tick.
- Trạng thái: Open (FE-A2 + UXD, trong #145 – điều kiện gộp)

### FB-R5-DOM-FE-145-02
- Mức độ: Minor
- Vị trí: `CheckOutPage.tsx`, bước 2, `timeError` khi `overdueAfterLimit`; chữ `checkout.overdue_after_limit`, `checkout.overdue_time_help`.
- Vấn đề:
  - Trên đơn quá ngày đi, quản lý gõ 03:00 vì khách đi 03:00 sáng ngày đi. Desk hiện "Giờ này quá mốc trả muộn của ngày đi. Khách ở thêm đêm đó thì gia hạn trước, rồi trả phòng." (V515-01, mục 3.1).
  - Dòng nhắc ngay trên lại hứa "Giờ khách rời căn, ngày 10/11".
  - Quản lý hoặc bị kẹt, hoặc làm theo câu và gia hạn một đêm khách không ở.
- Vì sao quan trọng: gia hạn ở đây là tính oan khách một đêm (700.000 ở ví dụ), dễ bị khiếu nại qua OTA. Cách tạm (mục 3.3) chỉ chạy khi người làm biết nó. Ca hiếm nên chỉ để Minor.
- Đề xuất sửa:
  - Khi `overdue` và giờ gõ < `property.businessDayRollover`: thay `checkout.overdue_after_limit` bằng câu riêng, UXD chốt chữ. Nghĩa: "Giờ trước {rollover} Desk hiểu là rạng sáng ngày {D+1}. Khách đi rạng sáng ngày {D}: ghi {rollover} và ghi giờ thật vào lý do."
  - Nên làm cùng lượt sửa thẻ 01, vì cũng là chữ chờ UXD. Không kịp thì sổ tay (BA) và release notes (ORC) như mục 3.3.
  - Bỏ câu này khi bản sửa của ARC lên (mục 3.5).
- Trạng thái: Open (FE-A2 + UXD; v1.0.5 nếu kịp)

### FB-R5-DOM-FE-145-03
- Mức độ: Minor
- Vị trí: màn chỉ dẫn ở `CheckOutPage.tsx` (nhánh không có `overdue` action), ngăn đơn `ReservationDrawer.tsx` (nút khóa); chữ `checkout.overdue_need_manager`, `checkout.overdue_need_owner` (UXD đã chốt ở `UXD-on-fe-prs-125-128.md` mục 3).
- Vấn đề:
  - Lễ tân thấy căn quá ngày đi còn "Đang ở", và Desk chỉ nói "cần quản lý hoặc chủ đầu tư trả phòng".
  - Thực tế ở quầy có hai ca:
    - khách đã đi → cần quản lý;
    - khách xin ở thêm mà lễ tân quên gia hạn, hoặc khách còn trong căn → lễ tân **tự Gia hạn được** (B13 có trong `allowedActions` cho FD+) rồi trả phòng như thường.
  - Màn không nhắc ca thứ hai. Quyết định "khách có ở thêm không" bị đẩy cho quản lý ở xa, trong khi người kiểm được căn là lễ tân.
- Vì sao quan trọng:
  - Một đêm khách đã ở có thể bị ghi là "quên bấm" (rủi ro cuối mục 2).
  - Ca ở thêm phải chờ quản lý dù không cần. 7.1 ý 4 đếm số ca chờ quá 2 giờ.
- Đề xuất sửa:
  - Thêm một câu trước câu gọi ai, UXD chốt chữ. Nghĩa: "Kiểm căn hoặc hỏi buồng phòng trước. Khách còn ở hoặc đã ở thêm đêm: bấm Gia hạn."
  - Hai khóa need_* giữ nguyên.
  - Không kịp v1.0.5 thì BA đưa vào sổ tay ca sáng. Câu sổ tay ca đêm ở 14.3 đã có ý này.
- Trạng thái: Open (UXD + FE-A2; v1.0.5 nếu kịp, không thì v1.0.6; BA sổ tay ngay)

### FB-R5-DOM-FE-145-04
- Mức độ: Suggestion
- Vị trí: `OVERDUE_REASONS` (`overdue.tsx`), nút "Khách đi không báo", "Lễ tân quên bấm Trả phòng".
- Vấn đề:
  - Bấm nút là ô lý do đủ 3 ký tự ngay, gửi được liền.
  - Trên đường này không có `checkoutTimeNote`, nên lý do là chỗ **duy nhất** ghi bằng chứng của giờ đã chọn: ai thấy căn trống, lúc nào, khách có nhắn không.
  - Chủ đầu tư hậu kiểm (`overdueOnly`) chỉ thấy "Khách đi không báo", không biết 12:00 là có bằng chứng hay mặc định.
- Vì sao quan trọng: kiểm soát SEC ARC-03 dựa vào lý do. 15.3 ý 2 đã viết mẫu "Khách đi không báo, buồng phòng thấy trống lúc …".
- Đề xuất sửa: một trong hai cách, FE-A2 và UXD chọn.
  - Nút điền chữ kèm dấu phẩy và đặt con trỏ cuối ô, để quản lý ghi tiếp.
  - Hoặc thêm một dòng nhắc thứ hai dưới ô (không đụng help D12c của SEC). Nghĩa: "Ghi thêm cách biết giờ: ai thấy căn trống, lúc nào, khách có nhắn không."

  Không tăng độ dài tối thiểu.
- Trạng thái: Open (FE-A2 + UXD; tùy tác giả)

### FB-R5-DOM-FE-145-05
- Mức độ: Suggestion
- Vị trí: bước 2, ô tick `ci.told_guest` ("Tôi đã báo khách khoản phụ thu này") khi phụ thu tăng trên đơn quá ngày đi (T-15-24).
- Vấn đề: khách đã đi từ hôm trước. Quản lý phải tick "đã báo khách" để ghi phụ thu có bằng chứng (luật 15.4 ý 3), trong khi thường họ chỉ nhắn bill cho khách **sau** khi ghi.
- Vì sao quan trọng: ô tick nói một việc chưa làm. Quản lý ngại tick thì dễ chọn giờ trong ân hạn cho xong, và mất phụ thu có bằng chứng.
- Đề xuất sửa: trên đơn quá ngày đi, UXD dùng nhãn riêng ở v1.0.6. Nghĩa: "Tôi sẽ nhắn khách khoản phụ thu này cùng bill." Giữ nguyên tác dụng: vẫn bắt buộc chọn ghi, không có "bỏ qua" (BR-414). Sổ tay (BA): gửi bill qua Zalo hoặc tin nhắn OTA ngay sau khi ghi.
- Trạng thái: Open (UXD; v1.0.6)

## 6. Ca kiểm QA (oracle DOM, bổ sung 15.6)

Giá đêm cuối 700.000, không có khách đến cùng ngày, trừ khi ghi khác. Đơn đi 10/11, bấm 09:00 ngày 11/11, MGR (1 đêm).

| Mã | Ca | Mong đợi |
|---|---|---|
| T-15-26 | Hẹn 17:00 (đã ghi 350.000). Mở Trả phòng | Ô giờ 17:00. Phụ thu 350.000, không đòi tick (không tăng). Dòng nhắc là câu "có hẹn" (thẻ 01). Đổi 14:00 → `late_recalc` 350.000 → 210.000, không tick. B18: dòng trả muộn 210.000, `actual_checkout_at` 10/11 14:00 |
| T-15-27 | Không hẹn. Gõ 14:00 (nhân viên gặp khách trong căn lúc 14:00) | Phụ thu 210.000, đòi tick hoặc FOC, B15 ghi trước bước bill. Số cần thu gồm 210.000. Khách đã đi, chưa trả → quản lý ghi công nợ. Cùng T-15-24, chạy trên Desk |
| T-15-28 | Khách đi 03:00 sáng 10/11 (V515-01, trước khi sửa). Gõ 03:00, rồi gõ 06:00 | 03:00: câu thẻ 02 (hoặc `overdue_after_limit` nếu chưa làm thẻ 02), nút khóa, không ô giá đêm. 06:00: hộp xác nhận "06:00 ngày 10/11"; B18 200, phụ thu 0, không đêm thêm. Audit `nightsNotBilled = 1`, lý do có "03:00". Khai báo lưu trú ngày 10/11 |
| T-15-29 | Như T-15-28, sau bản sửa của ARC | Gõ 03:00 → 10/11 03:00, phụ thu 0, không có câu `checkout.post_midnight`, hộp xác nhận "03:00 ngày 10/11" (= T-15-23 trên Desk) |
| T-15-30 | FD mở ngăn đơn của lượt quá 1 đêm, khách còn ở và muốn ở tiếp | Nút Trả phòng khóa kèm câu gọi ai. Nút Gia hạn có. FD gia hạn tới ngày khách định đi (từ hôm nay trở đi) → lượt hết quá ngày đi, đêm qua được tính. Tới ngày đi mới, FD trả phòng như thường, không cần quản lý (thẻ 03) |

## 7. Việc theo vai

- **FE-A2:** thẻ 01 trong #145 (điều kiện gộp), kèm ca vitest. Thẻ 02 cùng lượt nếu kịp. Thẻ 03, 04 theo UXD.
- **UXD:** chữ cho thẻ 01 (bắt buộc), 02, 03 (nếu kịp), 04, 05 (v1.0.6). Đồng thời duyệt 10 khóa FE-A2 đang chờ.
- **ARC:** luật mục 3.5 cho V515-01, đưa vào danh sách 0.3.14 cùng PR106-02. 3 điều kiện ở 3.5 đi kèm bản sửa.
- **BA:** sổ tay:
  - 4 bước ở mục 3.3;
  - luật mục 4 (giờ hẹn khi không có bằng chứng);
  - câu "kiểm căn trước, khách ở thêm thì Gia hạn" (thẻ 03);
  - gửi bill sau khi ghi phụ thu trên đơn quá ngày đi (thẻ 05).
- **QA:** T-15-26 … T-15-30 trên Desk, cùng T15-x của FE-A2.
- **ORC:** release notes v1.0.5 thêm dòng cách tạm của V515-01 nếu thẻ 02 không kịp. Gộp #145 sau khi thẻ 01 xong và UXD duyệt chữ.
- **DOM:** ghi mục 4 vào `rules-v1.0.5.md` 15.3 (ý 2a), thêm T-15-26 … T-15-30 vào 15.6; BR-412 thêm ví dụ ở bản BR kế tiếp.

## 8. Điểm làm tốt

- Ai được ghi do máy chủ quyết, kể cả 403 lúc trang mở qua đêm. Desk không có chỗ nào tự đoán theo vai. Đây đúng là thứ 7.1 (a) cần để giới hạn 1 đêm của quản lý không bị lách.
- Giờ điền sẵn không lấy đồng hồ máy quầy, và thân B18 không mang đêm thêm hay phụ thu một đêm. Đường quá ngày đi không có lối nào thêm hay bớt đêm ngoài Gia hạn.
- Hộp xác nhận ghi cả giờ lẫn **ngày** khách rời, lấy từ `checkoutAt` của máy chủ. Đây là chốt chặn để bản sửa V515-01 sau này an toàn (mục 3.5 điều kiện 1).

## 9. Dòng đề xuất ghi `decision-log.md` (ORC ghi khi commit)

`| 2026-11-07 | 5 | **DOM – review FE PR #145 (V5-15 Desk, Trả phòng quá ngày đi) @ 011d44e7: DUYỆT CÓ ĐIỀU KIỆN** – điều kiện gộp FB-R5-DOM-FE-145-01 (Major): đơn có giờ hẹn trả muộn thì dòng nhắc dưới ô giờ không được bảo ghi giờ chuẩn (luật DOM mới, rules 15.3 ý 2a: không có bằng chứng giờ rời → giữ giờ hẹn, phụ thu B15 đã thỏa thuận giữ nguyên; có bằng chứng đi sớm hơn → giờ đó, tự giảm theo BR-412; ví dụ 700.000 hẹn 17:00: 350.000 / thấy trống 14:00 → 210.000 / nhắn 12:20 → 0), kèm 1 ca vitest; còn lại đạt: người ghi do máy chủ quyết (OWN; MGR ≤ 1 đêm; 403 requiredRole owner), chỉ dẫn gọi ai, 3 lý do, giờ điền sẵn là giờ hẹn hoặc giờ chuẩn, sau mốc cuối khóa và lấy balanceDueVnd, không có lối thêm hay bớt đêm ngoài Gia hạn. **FB-R5-FE-ARC-V515-01 – trả lời nghiệp vụ:** không bắt buộc ở v1.0.5 (cần khách đi 00:00–05:59 ngày đi VÀ cả ngày nghiệp vụ đi không ai bấm; đường thường ghi 03:00 đúng); tới khi sửa thì ghi 06:00 ngày đi, lý do ghi giờ thật, không gia hạn; cách tạm đúng tiền (nightsNotBilled, phụ thu 0, không đêm thêm, ngày khai báo, mốc kiểm căn, hoa hồng như nhau; chỉ lệch giờ đăng ký lưu trú trong cùng ngày); luật cho bản sửa v1.0.6 (ARC chọn cách): trên đơn quá ngày đi, giờ gõ trước mốc đổi ngày là rạng sáng của chính ngày đi, kèm 3 điều kiện (hộp xác nhận ghi ngày, dòng nhắc nói cách đọc giờ, không hiện checkout.post_midnight); thẻ mới 02, 03 Minor, 04, 05 Suggestion; không ESC | DOM | rounds/round-05/reviews/DOM-on-fe-pr-145.md |`

## 10. Delta @ `b834ea56`

- Bước: Review (delta) | Ngày: 07/11/2026
- Đối tượng: `011d44e7..b834ea56`. Phần sửa nằm ở `c937ffd0`. `c2f883a4` chỉ gộp main @ `c2d5588d` và sinh lại `strings.js`. `b834ea56` chỉ sửa báo cáo FE mục 6.
- Chữ: UXD `copy-v1.0.5.md` bản 2.4 mục 9.15 (UXD review `rounds/round-05/reviews/UXD-on-fe-prs-145-146.md`). ARC review `rounds/round-05/reviews/ARC-on-fe-prs-145-146.md` mục 3.2–3.3: hoãn V515-01 sang 0.3.14, như mục 3.2 ở trên.
- Cách kiểm:
  - cây làm việc tạm ở scratchpad tại `b834ea56`, không commit, không đẩy lên nhánh PR;
  - chạy `v5-15-overdue-fea.test.tsx`: 21/21 xanh. Cả bộ admin-web: 96 tệp, 1099 ca xanh. Trong đó có tệp dò của DOM, chép 21 ca của PR và thêm 3 ca dò; riêng PR là 95 tệp, 1075 ca;
  - DOM viết 3 ca dò trên mock (mục 10.2) để xem **số tiền**, không chỉ chữ. Các ca này chỉ có trong thư mục tạm.
- CI lúc review (`gh pr checks 145`): `format · lint · audit · test · build` và Playwright landing đang chờ, các job khác xanh. ORC xem lại trước khi gộp.

### 10.1 Thẻ của DOM

| Thẻ | Mã ở `c937ffd0` | Kết quả |
|---|---|---|
| 145-01 Major (điều kiện gộp) | Có giờ hẹn (`agreedCheckoutTime`): dòng nhắc chỉ còn **một câu**, `checkout.overdue_time_help_agreed`: "Không có bằng chứng thì giữ {giờ hẹn} và phụ thu đã hẹn. Có bằng chứng khách đi sớm hơn (trả chìa, tin nhắn, buồng phòng thấy căn trống) thì ghi giờ đó." Bỏ `co.time_from_late` trên đơn quá ngày đi. Không hẹn: câu chuẩn như cũ | **Done.** Đúng 15.3 ý 2a. Test: hẹn 17:00 → ô 17:00, câu "giữ 17:00", không có "12:00", không có "không phụ thu"; phụ thu 350.000, không có ô tick; đổi 14:00 → `late_recalc` 350.000 → 210.000, không tick, dòng nhắc giữ câu "có hẹn" |
| 145-02 Minor | `overdue_time_early` thay `overdue_after_limit` dưới ô giờ và ở lý do khóa nút, khi đã quá mốc cuối **và** ngày lịch của `checkoutAt` máy chủ trả ≠ ngày đi hiệu lực. `{rollover}` lấy từ `property.businessDayRollover` | **Done.** Câu nói đủ 3 ý: cách Desk đọc giờ, ghi {rollover} và giờ thật vào lý do, không gia hạn; khách đi rạng sáng hôm sau thì gia hạn. So theo ngày máy chủ trả, không so giờ gõ, nên khi bản sửa v1.0.6 lên, câu này tự tắt mà Desk không phải đổi. Test: 03:00 → câu sớm, không `post_midnight`; 06:00 → B18 với `checkoutAt` ngày đi 06:00, lý do có "03:00", không đơn con gia hạn; lượt đã gia hạn mà vẫn quá ngày đi → `{date}` là ngày đi sau gia hạn; 18:30 ngày đi vẫn là "gia hạn trước" |
| 145-03 Minor | `overdue_extend_hint` ("Trước khi gọi, kiểm căn: khách còn ở hoặc đã ở thêm đêm thì bấm Gia hạn, không cần chờ.") đặt sau câu gọi ai, ở màn chỉ dẫn và ở ngăn đơn, **chỉ khi** máy chủ mời `extend_stay` | **Done.** Không hứa nút người xem không có. Nút Gia hạn có ở ngăn đơn của FD (test) |
| 145-04 Suggestion | `overdue_reason_evidence` đặt trước help D12c (một dòng nhắc). Hai gợi ý đầu đặt con trỏ cuối ô | **Done.** Help D12c của SEC vẫn luôn hiện, kể cả sau lỗi |
| 145-05 Suggestion | Chưa làm, UXD để sẵn khóa cho v1.0.6 | **Deferred** v1.0.6, đúng đề xuất |

### 10.2 Ca dò tiền của DOM trên mock (không commit)

| Ca | Làm | Thấy | Kết quả |
|---|---|---|---|
| P1 – cách tạm 06:00 (T-15-28) | MGR, đơn quá 1 đêm, gõ 06:00, gợi ý "Khách đi không báo" + ", khách nhắn đi lúc 03:00 sáng ngày đi", Hoàn tất | Tóm tắt: "Trả đúng giờ" (không phụ thu). Folio trước và sau B18 giống hệt: số dòng tiền phòng không đổi, không có dòng trả muộn, không đơn con. `actualCheckoutAt` = ngày đi 06:00. Thân B18 chỉ có `checkoutTime`, `checkoutAt`, `overdueReason`, `applyLateSurcharge: false` | **Đúng tiền** như mục 3.4 |
| P2 – T-15-27 | Không hẹn, giá 700.000, gõ 14:00 | Phụ thu 210.000 (30 %). "Tiếp tục" khóa, lý do "Tick 'Tôi đã báo khách khoản phụ thu này' để bật nút Tiếp tục." Tick xong thì mở | **Đúng.** Phụ thu tăng phải chọn ghi (15.4 ý 3, BR-414) |
| P3 – T-15-26 ghi thật | Hẹn 17:00, dòng 350.000 đã ghi và đã thu, gợi ý "Lễ tân quên bấm", Hoàn tất với giờ điền sẵn | `checkoutAt` ngày đi 17:00. Dòng trả muộn 350.000 vẫn `posted`, không đảo, không thành tiền dư phải hoàn | **Đúng** 15.3 ý 2a |

Ghi chú về mock: `overdueStay()` chỉ dời ngày đi, không bỏ dòng tiền phòng của các đêm cũ, nên folio mock còn một dòng đêm của ngày đi. Đây là dữ liệu mẫu của test, không phải hành vi của Desk. Không ảnh hưởng kết luận, vì DOM so folio trước và sau B18 trên cùng dữ liệu. Không ra thẻ.

### 10.3 Kết luận delta

**#145 @ `b834ea56`: DUYỆT** (thay cho DUYỆT CÓ ĐIỀU KIỆN @ `011d44e7`).

- 145-01 Done, điều kiện gộp đã đạt. 145-02, 145-03, 145-04 Done. 145-05 Deferred v1.0.6.
- Delta không đổi luật ai được ghi, số đêm, thân B18 hay số tiền nào của máy chủ. Chỉ đổi chữ, chỗ đặt chữ và con trỏ.
- **Không có thẻ mới, không có ESC.**
- Việc còn lại:
  - **ORC:** gộp sau khi CI xanh trên `b834ea56`. Dòng "Giới hạn đã biết" của ARC (`ARC-on-fe-prs-145-146.md` mục 3.3) viết "Desk … báo 'gia hạn trước'". Từ `c937ffd0`, Desk hiện câu sớm (`overdue_time_early`), nên sửa vế đó thành "Desk nói giờ trước 06:00 được hiểu là rạng sáng hôm sau". Phần "không gia hạn, gõ 06:00, ghi giờ thật vào lý do" giữ nguyên.
  - **ARC, v1.0.6 (0.3.14):** điều kiện 3 ở mục 3.5 (không hiện `checkout.post_midnight` trên đơn quá ngày đi) đi cùng bản sửa máy chủ, như ARC mục 3.2 ý 2 đã ghi. Câu sớm tự tắt, không cần đổi.
  - **QA:** T-15-26 … T-15-30 (đã vào `rules-v1.0.5.md` 15.6).
  - **BA:** sổ tay theo mục 3.3 và 15.3 ý 2a.
- **Luật DOM đã ghi:** `rounds/round-05/outputs/DOM/rules-v1.0.5.md`
  - mục 15.3 thêm ý 2a (giờ hẹn khi không có bằng chứng) và bảng ví dụ BR-412;
  - thêm ý 6 (đơn quá ngày đi, khách đi rạng sáng ngày đi);
  - mục 15.6 thêm T-15-26 … T-15-30;
  - dòng "Sửa" ở đầu tệp và mục 0.

  Không đổi con số nào của INV. Bảng BR-412 trong `business-rules.md` thêm ví dụ ở bản BR kế tiếp.

### 10.4 Dòng đề xuất ghi `decision-log.md` (ORC ghi khi commit)

`| 2026-11-07 | 5 | **DOM – delta review FE PR #145 (V5-15 Desk, Trả phòng quá ngày đi) @ b834ea56 (011d44e7..b834ea56, sửa ở c937ffd0): DUYỆT** – 145-01 Done (có giờ hẹn: một câu overdue_time_help_agreed, giữ giờ hẹn và phụ thu đã hẹn, có bằng chứng sớm hơn thì ghi giờ đó; bỏ co.time_from_late trên đơn quá ngày đi; test hẹn 17:00 → 350.000 không tick, 14:00 → late_recalc 350.000 → 210.000); 145-02 Done (overdue_time_early khi ngày của checkoutAt máy chủ ≠ ngày đi hiệu lực, tự tắt khi bản sửa v1.0.6 lên; 03:00 → câu sớm, 06:00 → B18 ngày đi 06:00, lý do có 03:00, không đơn con; lượt đã gia hạn vẫn quá ngày đi đúng ngày); 145-03 Done (overdue_extend_hint chỉ khi có extend_stay); 145-04 Done; 145-05 Deferred v1.0.6; DOM dò tiền trên mock: 06:00 không phụ thu, không thêm đêm, folio trước = sau; 14:00 → 210.000 phải tick; hẹn 17:00 ghi thật giữ dòng 350.000; 21/21 và cả bộ admin-web xanh ở cây tạm; không thẻ mới, không ESC; rules-v1.0.5.md 15.3 thêm ý 2a + bảng ví dụ BR-412 và ý 6 (cách tạm V515-01), 15.6 thêm T-15-26…30; ORC sửa vế "báo gia hạn trước" trong dòng Giới hạn đã biết của ARC 3.3; gộp khi CI xanh | DOM | rounds/round-05/reviews/DOM-on-fe-pr-145.md |`
