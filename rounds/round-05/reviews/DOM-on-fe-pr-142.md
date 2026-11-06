# DOM review – FE PR #142 (V5-11 Desk: Trả sớm và phí giữ lại trong 00:00–05:59)

- Người review: DOM | Round 5 – bước Review (nghiệp vụ, góc quầy lễ tân ca đêm) | Ngày: 07/11/2026
- Đối tượng: **#142**, nhánh `r5-fe-v5-11` @ `52a14957` (draft, FE-4). Nội dung ở `ae2b0e9e` + `52a14957`. Gộp sau BE #114 (`r5-a2` @ `f730b691`, chưa gộp). Báo cáo FE: `rounds/round-05/outputs/FE/v5-11-desk.md` (trên `main`).
- Đối chiếu:
  - luật: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 2 (2.1 (1)–(6), 2.2, 2.4), mục 7.6, 14.3; BR-010, BR-011, BR-421, BR-428;
  - review của DOM về #114: `rounds/round-05/reviews/DOM-on-be-a1-prs-127-114.md` (mục 3, 4);
  - chữ: UXD `copy-v1.0.5.md` bản 2.2 mục 9.13 và các ca QA của 9.13 (mục 8);
  - review của UXD về PR này: `rounds/round-05/reviews/UXD-on-fe-pr-142.md` (thẻ UXD-142-01, 02);
  - máy chủ #114 @ `f730b691`: `stay.service.ts` `earlyDeparture` (kiểm W), `allowed-actions.ts` `checkOutOpen`, `earlyDepartureOpen`, `shared/business-day.ts` `isCheckoutDay`, `minCalendarDate`, `frontdesk.controller.ts` (kết quả B16 dựng từ đơn đọc lại sau khi ghi).
- Cách đọc:
  - `gh pr view 142`, `gh pr diff 142`, `git show <sha>:<tệp>`, không checkout;
  - DOM chạy **3 ca tái hiện** trên bản sao mã `52a14957` trong thư mục tạm (mock MSW, đồng hồ giả như test FE). Không commit, không đẩy lên nhánh PR. Kết quả ở mục 3 và thẻ 02.
- CI lúc review (`gh pr checks 142`): `infra scripts (shellcheck)` đỏ, các job khác đang chờ. ORC xem trước khi gộp.
- Không có dữ liệu khách. Giá 700.000 và các số tiền là số ví dụ của oracle BR-428-14, BR-428-15.

Gọi **W** là khoảng 00:00 tới trước giờ đổi ngày nghiệp vụ (06:00) của ngày lịch D+1, khi ngày nghiệp vụ vẫn là D (BR-010).

## 1. Kết luận

**#142 @ `52a14957`: DUYỆT CÓ ĐIỀU KIỆN. SHA này chưa gộp được như hiện tại.**

- **Điều kiện gộp:** sửa **FB-R5-UXD-FE-142-01 (Major)** theo 4 tiêu chí nghiệp vụ ở mục 3.3, kèm test.
  - DOM không mở thẻ trùng, vì đã có thẻ UXD-01. DOM đồng ý mức Major: đây đúng là ca V5-11 sinh ra để xử lý (hộp mở trước 00:00, khách quyết sau 00:00).
  - Sửa xong thì DOM chỉ xem phần mã thay đổi, rồi chuyển DUYỆT. Không cần review lại toàn bộ.
- **Vẫn giữ thứ tự gộp:** #114 trước, #142 sau, cùng một tag phát hành (DOM review #114 mục 4).
- **Phần còn lại đúng nghiệp vụ:** ngày đặt sẵn, thứ tự 409, chuyển sang Trả phòng, số tiền chỉ lấy của máy chủ, nút "Trả phòng ngay" ở bước ③ (mục 2).
- **Thẻ mới của DOM** (không chặn gộp):
  - 01 Minor: nhận biết W chỉ dựa vào giờ máy quầy;
  - 02 Minor: ngày nghiệp vụ của hộp có thể chậm 1 ngày, nên dòng ngày ghi phí ghi sai ngày;
  - 03 Minor: chữ "đêm qua" của UXD;
  - 04 Suggestion: sổ tay ca đêm.
- **Chữ cho lễ tân ca đêm:** rõ, đủ dùng lúc 3 giờ sáng. Còn hai chỗ nên sửa (thẻ 03, và câu lý do ở bước ① thuộc thẻ UXD-01). Xem mục 4.
- **Không có ESC.** Mọi điểm thuộc quyền DOM (đúng nghiệp vụ), UXD (chữ) hoặc FE (mã).

## 2. Kiểm theo 5 điểm ORC giao

Ví dụ chung (oracle BR-428-14): đơn trực tiếp 20–24/10 × 700.000, khách báo và đi lúc 03:00 ngày 21/10 (ngày nghiệp vụ 20/10).

| # | Điểm kiểm | Mã #142 | Kết quả |
|---|---|---|---|
| 1 | Sau nửa đêm, Ngày rời mới đặt sẵn **ngày lịch** | `minCalendarDay(useBusinessDay, giờ máy quầy, rollover)` → 21/10. `useState(minDate)` lấy ngày này khi mở hộp. Test T-11-6 lúc 02:00: ô = D, `min` = D | **Đạt** khi hộp mở trong W. Ngày lịch là đúng (rules 2.1 (2)). Câu "đặt sẵn theo ngày nghiệp vụ" trong lời giao là nhầm, FE làm đúng khi theo hợp đồng |
| 2 | Đêm qua tính là đêm đã ở; ngày rời sớm nhất kèm nút "Dùng {date}" | Có khi máy chủ trả 409 `minNewDepartureDate`, ở cả tính thử lẫn lần ghi: câu `err.min_date` dưới ô, nút `use_min_date` chỉ điền ô | **Chưa đạt ở ca chính.** Hộp mở trước 00:00 rồi dùng tiếp sau 00:00 thì Desk tự chặn trước khi hỏi máy chủ: bước ② treo, bước ① chỉ có câu khoảng ngày chung (thẻ UXD-01, DOM tái hiện ở mục 3) |
| 3 | Sau nửa đêm của ngày đi: chỉ Trả phòng, không Trả sớm | Máy chủ không đưa `early_departure` vào `allowedActions` cho lượt đi hôm nay theo ngày lịch (#114). Hộp mở từ khung đơn cũ: `night && stayEnd <= estimate` → Alert `use_checkout`, không gọi B16, đọc lại đơn một lần. 409 `useCheckout` (tính thử hoặc ghi) → cùng Alert. Test 8–10 | **Đạt.** Ví dụ đơn 20–21/10, 03:00 ngày 21/10: không có nút Trả sớm; nếu hộp vẫn mở thì có Alert và "Trả phòng ngay". Trang Trả phòng hiện `checkout.post_midnight` (đã có trên `main`), phụ thu 0 |
| 4 | Dòng phí nói phí ghi vào **ngày nghiệp vụ** | `fee_business_date` dưới "Phí trả phòng sớm" ở bước ②, sau câu phí ở bước ③. Chỉ trong W và khi phí > 0. Số phí là `earlyDepartureFeeVnd` của máy chủ; test số lạ 1.234.000 / 456.000 | **Đạt.** Ca ví dụ: "…phí ghi vào ngày nghiệp vụ 20/10/2026", khớp dòng phí 1.050.000 ngày 20/10 trên folio (BR-428-16). Riêng ngày trong câu lấy từ `useBusinessDay`: có lúc chậm 1 ngày (thẻ 02) |
| 5 | "Trả phòng ngay" hiện **đúng khi** máy chủ cho `check_out` | Bước ③: `canCheckOut` chỉ còn đọc `result.reservation.allowedActions`. Nhánh `use_checkout`: đọc `r.allowedActions` của đơn sau khi tải lại. Hai nhánh không còn so ngày ở Desk | **Đạt.** Ví dụ ORC: B16 về 21/10 lúc 03:00 ngày 21/10. Đơn đọc lại sau khi ghi có ngày đi 21/10. Máy chủ mở B18 vì `inPostMidnightWindow` (ngày lịch 21/10 = ngày đi trong W), nên có `check_out` → nút "Trả phòng ngay" và câu "Ngày rời là hôm nay…". Trước PR, nút này mất và Desk hiện câu sai "nút Trả phòng hiện vào ngày đó". Ngày rời 22/10 thì không có `check_out` → `later_hint`, đúng vì nút có từ 00:00 ngày 22/10 (V5-10) |

Kiểm thêm phía máy chủ mà Desk dựa vào (#114 @ `f730b691`):
- Kiểm W chạy trước mọi kiểm ngày, cả `dryRun`. `useCheckout` khi ngày đi hiệu lực ≤ ngày lịch, `minNewDepartureDate` = ngày lịch. Khớp mock của PR.
- Kết quả B16 ghi thật dựng từ `dtoOf` của đơn đọc lại trong cùng lệnh, nên `allowedActions` ở bước ③ là trạng thái sau khi ghi.
- `deposit_forfeit` và `early_departure_fee` trong mock mang ngày nghiệp vụ, đúng rules 2.1 (5).
- Phí trả sớm ban ngày cũng đổi sang ngày thao tác, như DOM review #114 mục 3.4.

## 3. Hộp mở qua 00:00 (thẻ UXD-142-01): DOM tái hiện và tiêu chí nghiệp vụ

### 3.1 Ca thật ở quầy

Đơn trực tiếp 19–24/10 × 700.000 (oracle BR-428-15).
- 23:55 ngày 20/10: khách xuống quầy báo muốn đi sớm. Lễ tân mở Trả sớm. Ô đặt sẵn 20/10, đúng lúc đó (ngày nghiệp vụ 20/10, ngoài W).
- Lễ tân giải thích số hoàn, khách gọi điện hỏi người nhà. 00:05 ngày 21/10, khách đồng ý đi sáng nay.
- Từ 00:00, ngày 20/10 không còn hợp lệ: đêm 20/10 là đêm khách đã ở (rules 2.1 (1), (2)).

### 3.2 Kết quả tái hiện ở `52a14957` (mock, đồng hồ giả; đơn mẫu 4 đêm của mock)

| Ca | Thao tác | Kết quả |
|---|---|---|
| R1 | Mở 23:55, giữ ngày đặt sẵn (ngày nghiệp vụ), không làm gì; 00:05 bấm "Xem trước số tiền" | Sang bước ②, hiện "Đang tính thử…" và khung xám mãi; **0 lệnh** gửi máy chủ sau 00:05; nút Xác nhận khóa. Bấm "← Sửa lại": dưới ô chỉ có "Chọn ngày từ {ngày lịch} đến …". Không có câu "Đang sau nửa đêm nên…", không có nút "Dùng {date}" |
| R2 | Xem trước lúc 23:58 (bước ② có số); 00:02 tick "Đã báo khách số hoàn và phí trả phòng sớm" | Bảng số biến mất ngay, thay bằng "Đang tính thử…". Nút Xác nhận `aria-disabled`; bấm thì **0 lần ghi** |

Nguyên nhân (cùng phân tích của UXD):
- mỗi lần vẽ lại sau 00:00, `estimate` thành ngày lịch;
- ngày đang chọn thành lỗi ở client trước khi máy chủ kịp trả 409;
- khi có lỗi client thì `sig = ''`, nên không có lần tính thử nào chạy và bản tính cũ bị bỏ.

Test 7 của FE chỉ đạt vì không có lần vẽ lại nào giữa lúc đổi giờ và cú bấm. Trong thực tế, lễ tân **phải** tick "Đã báo khách" trước khi xác nhận, nên R2 là đường thường gặp.

Không sai tiền: không có gì được ghi, máy chủ #114 vẫn chặn đêm 20/10. Nhưng lễ tân trực một mình lúc nửa đêm gặp một màn hình báo "đang tính" mà không tính gì. Họ dễ đóng hộp làm lại hoặc gọi quản lý trong khi khách đứng chờ. Vì vậy là Major.

### 3.3 Tiêu chí nghiệp vụ cho bản sửa (DOM kiểm lại theo đúng các số này)

Cùng đơn 19–24/10 × 700.000, mở lúc 23:55 ngày 20/10, ô đang là 20/10:

1. **Bước ① sau 00:00** (vẽ lại, hoặc bấm "Xem trước số tiền" lúc 00:05): dưới ô hiện câu của máy chủ hay của Desk đều được, miễn là chữ của `err.min_date` với ngày **21/10/2026**, kèm nút "Dùng 21/10/2026". Không hiện câu khoảng ngày chung, không hiện câu chung `INVALID_TRANSITION`.
2. **Đang ở bước ②** (số tính lúc 23:58 cho ngày 20/10, tức bỏ 20, 21, 22, 23 = 4 đêm): sau 00:00, Desk không được giữ số đó để xác nhận, và không được treo "Đang tính thử…". Desk về bước ① với câu ở (1), bỏ tick "Đã báo khách", focus ô ngày. Lễ tân phải báo lại khách số mới.
3. **Bấm "Dùng 21/10/2026"** rồi xem trước. Khách báo lúc 23:55 ngày 20/10, nên ngày nghiệp vụ lúc báo là 20/10.
   - Giữ đêm 20/10 (700.000, tiền phòng). Bỏ 21, 22, 23 = 2.100.000.
   - Báo trước 21/10 − 20/10 = **1 ngày** → hoàn 50 % = **1.050.000**, phí trả phòng sớm **1.050.000**.
   - Dòng phụ "…ngày nghiệp vụ 20/10/2026". Nếu máy chủ đòi bằng chứng giờ báo thì lễ tân ghi chú như thường.
4. **Desk không chặn ngày mà máy chủ nhận.** Nếu bản sửa dùng mức sàn của Desk để chặn (cách 1 của UXD-01), mức sàn đó phải tính đúng W (thẻ DOM 01). Ví dụ: 06:01 theo máy chủ, máy quầy chậm 2 phút, mở hộp. Ngày rời mới tối thiểu phải là 21/10 (ngày nghiệp vụ, báo trước 0, không hoàn), **không** phải 22/10. Nếu Desk ra 22/10 rồi bảo "Dùng 22/10", khách bị giữ thêm một đêm không ở.

Test cần thêm: R1, R2 như bảng 3.2, kỳ vọng như (1) và (2).

## 4. Chữ – có rõ với lễ tân ca đêm không

| Khóa | Câu VI | Nhận xét DOM |
|---|---|---|
| `use_checkout` | Đang sau nửa đêm của ngày đi – không cần Trả sớm, làm Trả phòng như thường lệ. Chưa ghi gì. | **Rõ.** Câu nói việc phải làm và trấn an rằng chưa ghi gì. Nút "Trả phòng ngay" nằm ngay đó. Ca rất hiếm: đơn đã quá ngày đi (V5-15) thì FD không có nút Trả phòng mà câu vẫn bảo "làm Trả phòng". Ca này chỉ gặp khi mở từ khung đơn rất cũ, nên không mở thẻ |
| `fee_business_date` | Đang sau nửa đêm nên phí ghi vào ngày nghiệp vụ {date}. | **Rõ.** Lễ tân đã gặp "ngày nghiệp vụ" ngay trong hộp này ("Báo trước 1 ngày (ngày nghiệp vụ lúc khách báo: 20/10/2026)"). Màn Hôm nay cũng hiện ngày nghiệp vụ trên thanh tiêu đề, và quản lý đối chiếu được với dòng phí trên folio. Chỉ cần ngày trong câu đúng (thẻ 02) |
| `err.min_date` | Đang sau nửa đêm nên đêm qua là đêm khách đã ở. Ngày rời mới sớm nhất là {date}. | **Hiểu được, nhưng "đêm qua" mơ hồ lúc 00:00–05:59.** Lúc 00:05, người trực đêm thường gọi đêm đang trực là "đêm nay"; "đêm qua" dễ hiểu thành đêm 19/10. Ghi thẳng ngày thì hết đoán (thẻ 03) |
| `use_min_date` | Dùng {date} | **Rõ, ngắn.** Nút chỉ điền ô, không ghi gì. Tính thử tự chạy sau đó chỉ là đọc: DOM đồng ý với UXD |
| `checkout_now_hint` / `later_hint` | Ngày rời là hôm nay… / Khách trả phòng ngày {date} như thường lệ – nút Trả phòng hiện vào ngày đó. | **Đúng** sau khi `canCheckOut` theo máy chủ. Lúc 03:00, "hôm nay" là ngày lịch, khớp đồng hồ trên tường |

Chỗ dễ gây nhầm nhất không nằm ở câu chữ mà ở hai ngày khác nhau trên màn.
- Lúc 03:00 ngày 21/10, thanh tiêu đề màn Hôm nay ghi **20/10** (ngày nghiệp vụ), còn hộp Trả sớm đặt sẵn **21/10**.
- Lễ tân mới dễ "sửa lại" thành 20/10. Khi đó Desk phải nói lý do, không chỉ báo khoảng ngày. Phần này nằm trong tiêu chí (1) ở mục 3.3; sổ tay ở thẻ 04.

## 5. Giả định của FE – DOM xác nhận

1. **Ngày đặt sẵn trong W là ngày lịch: đúng** (rules 2.1 (2), hợp đồng 0.3.13, UXD 9.13).
2. **"Dùng {date}" không gửi lệnh ghi; tính thử tự chạy sau 400 ms: đồng ý.** Lễ tân vẫn tự bấm Xem trước, rồi tick "Đã báo khách", rồi mới Xác nhận.
3. **"Trả phòng ngay" chỉ dựa vào `allowedActions`: đúng và tốt hơn.** Một nguồn duy nhất là máy chủ. Ngoài W kết quả không đổi so với v1.0.4.
4. **Ước tính W ở Desk, máy chủ thắng (`serverMin ?? estimate`):**
   - khi Desk ước tính **sớm hơn** máy chủ: đúng, máy chủ trả 409 và Desk theo (DOM thấy ở ca tái hiện của thẻ 02);
   - khi Desk ước tính **muộn hơn** máy chủ: máy chủ không có dịp sửa, vì Desk chặn ngay ở client (thẻ 01).

## 6. Ghi chú cho vai khác (không phải thẻ FE)

- **ORC:**
  - gộp #142 sau #114, cùng tag;
  - nếu #142 trễ mà #114 đã lên, release notes giữ dòng (b) "Giới hạn đã biết" trong DOM review #114 mục 4;
  - xem CI (shellcheck đỏ lúc review).
- **QA:**
  - trên staging, chạy giờ thật các ca 9.13 của UXD (T-11-1, T-11-2, T-11-4 trên Desk) và R1, R2 ở mục 3.2;
  - sau khi FE sửa, chạy lại theo tiêu chí 3.3;
  - xem thẻ 02 để quyết có ghi bug cho `useBusinessDay` không (DOM đề xuất P2, lỗi có từ R3).
- **UXD:** thẻ 03. Câu lý do ở bước ① cùng thẻ UXD-01 (UXD đã đề xuất dùng `err.min_date` với mức sàn của Desk).
- **BA:** thẻ 04 (một dòng sổ tay ca đêm).
- **ARC:** thẻ 02, cách (b), nếu chọn thêm trường ngày ghi phí ở 0.3.14.

## 7. Thẻ

### FB-R5-DOM-FE-142-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/app/dates.ts` `minCalendarDay`; `pages/stay/EarlyDepartureDialog.tsx` (`estimate`, `night`, `minDate`).
- Vấn đề:
  - Desk xác định W chỉ bằng giờ máy quầy (`giờ < rollover`), rồi lấy ngày nghiệp vụ neo máy chủ cộng 1.
  - UXD 9.13 định nghĩa W là "ngày nghiệp vụ < ngày lịch theo múi giờ khách sạn". Hai cách lệch nhau khi máy quầy chậm hơn máy chủ ở quanh 06:00.
  - Ví dụ: 06:01 theo máy chủ (ngày nghiệp vụ 21/10), máy quầy 05:59. Me vừa được đọc lại trong khoảng lệch đó (ví dụ lễ tân vừa chuyển tab rồi mở hộp), nên ngày nghiệp vụ trên Desk đã là 21/10. Desk ra mức sàn **22/10** (21/10 + 1) và chặn 21/10 ở client, kể cả ô `min`. Máy chủ ngoài W nhận 21/10, nhưng Desk không gửi nên máy chủ không sửa được.
- Vì sao quan trọng:
  - Khách đi sớm lúc 06:01 ngày 21/10 mà Desk chỉ cho chọn 22/10. Đêm 21/10 khách không ở vẫn bị giữ, sai một đêm (700.000 ở ca ví dụ).
  - Cửa sổ lỗi chỉ bằng độ lệch đồng hồ quầy (giây tới vài phút), nên hiếm.
  - Nếu bản sửa UXD-01 dùng mức sàn của Desk để hiện "Dùng {date}" thì Desk còn bảo lễ tân dùng ngày sai, nên làm cùng bản sửa đó (cùng chỗ mã).
- Đề xuất sửa:
  - W chỉ khi **cả hai** đúng: giờ máy quầy < rollover **và** ngày nghiệp vụ < ngày lịch của máy quầy (`todayLocal(tz)`). Đó cũng là định nghĩa của UXD 9.13.
  - Nếu chỉ một điều đúng thì mức sàn = ngày nghiệp vụ, như ngoài W.
  - Thêm ca test: ngày nghiệp vụ 21/10, máy quầy 05:59 ngày 21/10 → mức sàn 21/10, không có dòng `fee_business_date`.
- Trạng thái: Open

### FB-R5-DOM-FE-142-02
- Mức độ: Minor
- Vị trí:
  - `pages/stay/EarlyDepartureDialog.tsx`: `feeDate={night ? today : undefined}` (bước ②), `date(today)` ở bước ③, với `today = useBusinessDay()`;
  - gốc: `app/businessDay.ts` (`anchor` là `useMemo` trong từng component).
- Vấn đề:
  - Mỗi component dùng `useBusinessDay` tự chụp "ước tính của máy" lúc **nó được mở**, không phải lúc câu trả lời Me về. Vì vậy, một hộp mở sau mốc 06:00 mà Desk chưa đọc lại Me từ trước mốc đó sẽ nhận ngày nghiệp vụ **chậm 1 ngày**. Desk đọc lại Me chủ yếu khi đăng nhập hoặc khi tab ẩn rồi hiện lại; đồng hồ hẹn giờ lúc 06:00 chỉ vẽ lại, không đọc lại Me.
  - DOM tái hiện ở `52a14957`: khung đơn mở lúc 10:00 ngày Y, hộp Trả sớm mở lúc 03:00 ngày D+1 (ngày nghiệp vụ đúng là D).
    - Ô đặt sẵn D, tính thử gửi D. Máy chủ (mock) trả 409 `minNewDepartureDate` D+1. Desk hiện đúng câu và nút "Dùng D+1", nên phần này máy chủ sửa được.
    - Nhưng `today` của hộp vẫn là Y. Dòng phụ ở bước ② và ③ sẽ ghi "phí ghi vào ngày nghiệp vụ **Y**", trong khi máy chủ ghi phí ngày **D**.
  - Ví dụ: máy quầy đăng nhập lúc 22:00 ngày 19/10, một phiên dùng qua nhiều ca, tab Desk luôn hiện, không đăng nhập lại. 03:00 ngày 21/10 (ngày nghiệp vụ 20/10), lễ tân trả sớm cho khách. Hộp ghi "…ngày nghiệp vụ **19/10/2026**", còn folio có dòng phí ngày **20/10**. Với dòng phụ này, lỗi chỉ gặp khi Desk không đọc lại Me từ trước 06:00 của hôm trước, nên ít gặp.
  - Ngoài W, cùng lỗi gốc này có từ R3 (không do PR) và dễ gặp hơn. Ví dụ: Me đọc lúc 22:00 (ca đêm), hộp mở lúc 06:30 cùng phiên. Hộp đặt sẵn ngày hôm qua → máy chủ 422 → câu "Chọn ngày từ {hôm qua}…" sai. Test hiện có (`r3-s1-fea.test.tsx`) chỉ phủ component mở **trước** mốc đổi ngày.
- Vì sao quan trọng:
  - Câu mới của PR nói một ngày ghi phí khác ngày trên folio. Quản lý đối soát doanh thu khác theo ngày (K-07) sẽ thấy lệch.
  - Lễ tân ca đêm tin câu trên màn hơn folio.
  - Không sai tiền: máy chủ ghi đúng ngày nghiệp vụ.
- Đề xuất sửa (FE chọn, không chặn gộp #142):
  - (a) **Sửa gốc** (nên làm, PR riêng được): chụp ước tính của máy **lúc câu trả lời Me về** (trong `SessionProvider`, cùng `businessDate`), không chụp ở từng component. Hoặc đọc lại Me ở mốc đổi ngày (đồng hồ hẹn giờ đã có sẵn). Thêm ca test "hộp mở sau 06:00, Me đọc trước 06:00".
  - (b) Hoặc ARC thêm vào `EarlyDepartureResult` (0.3.14) ngày dịch vụ của dòng phí, để Desk hiện đúng ngày máy chủ ghi.
  - Trong lúc chờ (a) hoặc (b): QA ghi bug P2 cho `useBusinessDay`; FE nối khi sửa.
- Trạng thái: Open

### FB-R5-DOM-FE-142-03
- Mức độ: Minor (chữ thuộc UXD; FE chỉ truyền thêm tham số)
- Vị trí: `early_departure.err.min_date` (`design/tools/gen_strings.py`, UXD 9.13); chỗ gọi trong `EarlyDepartureDialog.tsx`.
- Vấn đề:
  - Câu hiện tại: "Đang sau nửa đêm nên **đêm qua** là đêm khách đã ở. Ngày rời mới sớm nhất là 21/10/2026."
  - "Đêm qua" là từ tương đối, mà câu chỉ hiện từ 00:00 tới 05:59. Lúc này người trực đêm thường gọi đêm đang trực là "đêm nay"; "đêm qua" dễ hiểu thành đêm 19/10.
  - EN "last night" cũng vậy.
- Vì sao quan trọng:
  - Lễ tân dùng câu này để giải thích cho khách vì sao đêm 20/10 không được hoàn.
  - Folio ghi tiền phòng **20/10**. Câu có ngày cụ thể thì lễ tân đối chiếu được ngay.
- Đề xuất sửa:
  - VI: "Đang sau nửa đêm nên đêm {night} đã tính là đêm khách ở. Ngày rời mới sớm nhất là {date}."
  - EN: "It's after midnight, so the night of {night} counts as stayed. The earliest new departure date is {date}."
  - `{night}` = ngày nghiệp vụ (ngày trước `{date}`, cùng ngày của `fee_business_date`). UXD chọn nguồn. Theo 9.13 Desk không tự cộng ngày, nên UXD có thể lấy `useBusinessDay`, sau khi thẻ 02 sửa.
  - UXD quyết, có thể dời v1.0.6.
- Trạng thái: Open

### FB-R5-DOM-FE-142-04
- Mức độ: Suggestion
- Vị trí: sổ tay ca đêm (BA); tùy chọn câu giúp `early_departure.new_date_help` trong W (UXD).
- Vấn đề: lúc 03:00 ngày 21/10, thanh tiêu đề màn Hôm nay ghi 20/10, còn Trả sớm đặt sẵn 21/10. Lễ tân mới chưa biết luật V5-11 dễ nghĩ Desk sai và sửa lại thành 20/10.
- Vì sao quan trọng: mỗi lần sửa là một lần lỗi và một lần giải thích lại với khách đang đứng ở quầy.
- Đề xuất sửa:
  - BA thêm một dòng vào sổ tay ca đêm: "00:00–05:59, Trả sớm: Ngày rời mới đặt sẵn ngày hôm nay theo lịch. Đêm của ngày trên thanh tiêu đề (ngày nghiệp vụ) là đêm khách đã ở, luôn tính. Khách đi đúng ngày đi trên đơn: bấm Trả phòng, không Trả sớm."
  - UXD cân nhắc thêm vế lý do vào `new_date_help` khi đang trong W (v1.0.6).
- Trạng thái: Open

## 8. Dòng đề xuất ghi `decision-log.md` (ORC ghi khi commit)

`| 2026-11-07 | 5 | **DOM – review nghiệp vụ FE PR #142 (V5-11 Desk) @ 52a14957: DUYỆT CÓ ĐIỀU KIỆN** – đạt: đặt sẵn ngày lịch trong 00:00–05:59 (lời giao "ngày nghiệp vụ" là nhầm), thứ tự 409 useCheckout → minNewDepartureDate → câu chung, lượt đi hôm nay theo lịch chỉ Trả phòng, phí chỉ lấy số máy chủ kèm dòng "ghi vào ngày nghiệp vụ", "Trả phòng ngay" ở bước ③ theo allowedActions (B16 về 21/10 lúc 03:00 ngày 21/10 giữ nút). Điều kiện gộp: sửa FB-R5-UXD-FE-142-01 (Major, DOM tái hiện R1/R2: hộp mở qua 00:00 treo "Đang tính thử…", bước ① thiếu câu lý do và "Dùng {date}") theo 4 tiêu chí DOM mục 3.3 (đơn 19–24/10 × 700.000: Dùng 21/10, hoàn 1.050.000, phí 1.050.000 ngày 20/10; Desk không chặn ngày máy chủ nhận); gộp sau #114, cùng tag. Thẻ DOM: 01 Minor (W phải là giờ < rollover và ngày nghiệp vụ < ngày lịch), 02 Minor (useBusinessDay chụp mốc lúc mở hộp → hộp mở sau 06:00 chậm 1 ngày, dòng ngày ghi phí sai ngày; lỗi gốc từ R3, QA ghi bug P2), 03 Minor (UXD: "đêm qua" → "đêm {ngày}"), 04 Suggestion (BA sổ tay ca đêm) | DOM | rounds/round-05/reviews/DOM-on-fe-pr-142.md |`

## 9. Điểm làm tốt

- Desk không tự tính phí: số tiền chỉ lấy của máy chủ, có test số lạ và 4 đột biến chạy tay. Lễ tân ca đêm không thể báo khách một con số khác với số sẽ ghi.
- Bỏ so ngày ở `canCheckOut`, để máy chủ quyết khi nào được Trả phòng. Ca B16 về ngày lịch lúc 03:00 giờ dẫn thẳng sang Trả phòng. Đây là đường lễ tân cần nhất lúc nửa đêm.
- `nightHint()` gom đúng thứ tự 9.13 vào một hàm, dùng chung cho tính thử và lần ghi. Ca 409 ở lần ghi về bước ① như 412, không ghi gì.

---

## 10. Delta @ `710209ec` (Round 5 – Review, 07/11/2026)

- Phạm vi: chỉ `52a14957..710209ec`.
  - Mã FE: `3927e137` (UXD-142-01, DOM-142-01) và `7baac854` (ARC-142-03, ARC-142-01). Ba tệp: `app/dates.ts`, `pages/stay/EarlyDepartureDialog.tsx`, `__tests__/v5-11-early-departure-night-fea.test.tsx`.
  - `710209ec` là merge `main` (`c1c41043`). Merge không đụng 4 tệp của PR. `mocks/handlers.ts` đổi trong khoảng này là mã của `main`, không phải của PR.
  - Trả lời của FE: `rounds/round-05/responses/FE-responses.md` mục FE-4.
- Cách đọc:
  - worktree tạm của DOM, lấy `refs/pull/142/head`; không commit, không đẩy lên nhánh PR;
  - tệp test V5-11 đêm chạy 3 lần: 16/16 cả ba lần;
  - DOM chạy 4 đột biến, mỗi lần một chỗ rồi trả lại. Cả 4 đều bị bắt:
    - W chỉ theo giờ máy quầy: 2 ca đỏ;
    - bỏ đường về bước ①: ca R2 đỏ;
    - câu 9.13 chỉ khi máy chủ trả 409: 5 ca đỏ;
    - bỏ đồng hồ hẹn 00:00: ca "để yên qua 00:00" đỏ;
  - 3 ca dò của DOM (P-A, P-B, P-C ở mục 10.4) chạy trên mock MSW, đồng hồ giả như test FE. Ngày của mock theo ngày chạy test; ở đây quy về ví dụ 19–24/10.
- Máy chủ đối chiếu:
  - #114 head nay là `e9dcef63` = `f730b691` + merge `main` (`e0566ea6`);
  - khối W của B16 (`stay.service.ts`) và `shared/business-day.ts` không đổi so với `f730b691`. Hai chỗ này đã có trên `main`.
- CI lúc review (`gh pr checks 142`): mọi job đang chờ. ORC xem trước khi gộp.
- Không có dữ liệu khách. Số tiền là số ví dụ của oracle BR-428-14, BR-428-15.

### 10.1 Kết luận

**#142 @ `710209ec`: DUYỆT.**

- **DOM-142-01: Closed.** W giờ cần cả hai: giờ máy quầy trước mốc đổi ngày **và** ngày nghiệp vụ < ngày lịch. Mức sàn dùng đúng công thức của máy chủ (mục 10.2).
- **Bốn tiêu chí DOM 3.3 cho UXD-142-01: đạt cả bốn**, có test cho từng tiêu chí (mục 10.3). Phía nghiệp vụ, điều kiện gộp đã xong. UXD tự đóng thẻ của UXD.
- **Số tiền trong test khớp luật và từ điển 1.5** (mục 10.4).
- **Bắt báo lại khách lúc qua 00:00: đúng.** Ở quầy 10 căn ca đêm, việc này không gây vấn đề thật (mục 10.5).
- **Delta không làm Desk tính phí, ngày phí hay số ngày báo trước khác máy chủ** (mục 10.6).
- **Không thẻ mới. Không ESC.**
- Thẻ 02, 03, 04 giữ như ORC đã chốt: 02 thành PR nhỏ riêng sau #142, 03 chờ chữ UXD, 04 thuộc BA/UXD.
- **Vẫn giữ thứ tự gộp:** #114 trước, #142 sau, cùng một tag (mục 1).

### 10.2 DOM-142-01 – kiểm lại

| Ca | `minCalendarDay` (mức sàn) | `inEarlyHours` (W) | Máy chủ | Kết quả |
|---|---|---|---|---|
| Máy chủ đã 06:01 (ngày nghiệp vụ 21/10), máy quầy chậm 2 phút ở 05:59, Me vừa đọc lại | max(21/10, 21/10) = **21/10** | 05:59 < 06:00 nhưng 21/10 không < 21/10 → **không phải W** | ngoài W, sàn = ngày nghiệp vụ 21/10 | **Đạt.** Ô đặt sẵn 21/10, `min` 21/10, không có dòng phụ giờ đêm, 21/10 đi qua tới lần ghi (ca test "the server already at 06:01…") |
| 03:00 ngày 21/10, ngày nghiệp vụ 20/10 | **21/10** | W | `minCalendarDate` 21/10 | Đạt |
| 23:00 ngày 20/10 | **20/10** | không | 20/10 | Đạt |
| 06:30 ngày 21/10, Desk còn ngày nghiệp vụ 20/10 (lỗi gốc của thẻ 02) | max(20/10, 21/10) = **21/10** | 06:30 không < 06:00 → không | 21/10 | **Đạt, và tốt hơn trước.** Ở `52a14957`, hộp đặt sẵn 20/10 và máy chủ trả 422 với câu "Chọn ngày từ 20/10…" sai |

- Mức sàn của Desk = max(ngày nghiệp vụ, ngày lịch), đúng như `minCalendarDate` của máy chủ (`inEarlyHours ? calendarDate : today`).
- Thẻ 02 vì vậy còn một phần: ngày trong dòng phụ "phí ghi vào ngày nghiệp vụ {date}" vẫn có thể chậm 1 ngày trong W. Phần ô ngày đặt sẵn sai sau 06:00 (đoạn cuối thẻ 02) đã hết nhờ ARC-03. FE ghi điều này trong trả lời. PR riêng của thẻ 02 vẫn cần làm.

### 10.3 Bốn tiêu chí 3.3 – kết quả theo test

Đơn trực tiếp 19–24/10 × 700.000, trả đủ, mở hộp 23:55 ngày 20/10 (`domStay()` trong test: 5 đêm D−2…D+2 × 700.000, D = 21/10).

| # | Tiêu chí | Test của FE | Kết quả |
|---|---|---|---|
| 1 | Bước ① sau 00:00: câu `err.min_date` với 21/10 kèm "Dùng 21/10/2026"; không câu khoảng ngày, không câu chung `INVALID_TRANSITION` | R1 (bấm "Xem trước" lúc 00:05); để yên qua 00:00, không bấm gì (đồng hồ hẹn 00:00); focus một ô sau 00:00; T-11-6 (gõ hôm qua lúc 02:00) | **Đạt.** Ba đường dẫn tới cùng một câu: đồng hồ hẹn, focus, cú bấm. Không có lần tính thử nào cho 20/10 sau 00:00. Câu khoảng ngày chỉ còn khi chọn quá ngày cuối, đúng |
| 2 | Đang ở bước ②: không giữ số cũ, không treo "Đang tính thử…"; về bước ①, bỏ tick, focus ô ngày | R2 (tick lúc 00:02) | **Đạt.** Ca dò P-C của DOM: tick lúc 23:59, bấm "Xác nhận" lúc 00:02 → về bước ①, **0 lần ghi** với 20/10, ô tick biến mất |
| 3 | "Dùng 21/10" → giữ đêm 20/10, bỏ 21–23 = 2.100.000, báo trước 1 ngày, hoàn 1.050.000, phí 1.050.000, dòng phụ ngày 20/10 | R1 phần sau | **Đạt.** Báo trước "1 ngày"; hoàn 1.050.000; phí 1.050.000 kèm "…ngày nghiệp vụ 20/10"; lần ghi gửi `noticeGivenAt` 23:55 ngày 20/10, `expectedRefundVnd` = `expectedFeeVnd` = 1.050.000; folio có dòng phí 1.050.000 ngày 20/10 và vẫn còn dòng tiền phòng đêm 20/10 |
| 4 | Desk không chặn ngày máy chủ nhận (máy quầy chậm quanh 06:00) | "the server already at 06:01…" | **Đạt** (mục 10.2) |

### 10.4 Số tiền trong test so với luật và từ điển 1.5

Tham số: `early_departure_refund` đề xuất `{"minNoticeDays":1,"refundPct":50}` (ESC-006). "Báo trong ngày rời → 0". `business_day_rollover` 06:00. Luật: rules-v1.0.5 2.1 (1), (4), (5) và 2.2.

| Ca (ví dụ 19–24/10 × 700.000, khách báo 23:55 ngày 20/10) | Tính theo luật | Desk / mock | Khớp |
|---|---|---|---|
| R1/(3): sau 00:00, Ngày rời mới 21/10 | Giữ 19, 20. Bỏ 21, 22, 23 = 2.100.000. Báo trước 21/10 − 20/10 = 1 ≥ 1 → hoàn 50 % = **1.050.000**, phí **1.050.000**, ngày dịch vụ **20/10** (ngày nghiệp vụ lúc thao tác 00:05) | 1.050.000 / 1.050.000 / 20/10 | Có. Trùng rules 2.2 |
| P-A (DOM dò): trước 00:00, Ngày rời mới 20/10 | Bỏ 20–23 = 2.800.000. Báo trước 0 → hoàn **0**, phí **2.800.000** | 0 / 2.800.000 | Có |
| P-B (DOM dò): Ngày rời mới 22/10, bước ② lúc 23:59, xác nhận lúc 00:02 | Bỏ 22, 23 = 1.400.000. Báo trước 2 → hoàn **700.000**, phí **700.000**, ngày dịch vụ 20/10 | Bước ② không bị đẩy về ①, tick giữ nguyên. 1 lần ghi, 700.000 / 700.000. Bước ③: "…ngày nghiệp vụ 20/10" | Có |
| Ca (4): máy chủ 06:01, máy quầy chậm ở 05:59, Ngày rời mới 21/10 | Ngày rời 21/10 hợp lệ ở cả hai phía. Số ngày báo trước máy chủ tính theo `noticeGivenAt` Desk gửi (giờ máy quầy lúc mở hộp, 05:59 → ngày nghiệp vụ 20/10 → báo trước 1). Desk chỉ hiện số máy chủ trả | số của mock, không có dòng phụ giờ đêm. Mock dùng cùng một đồng hồ nên không dựng được độ lệch | Có, về phía Desk. Phần giờ báo xem mục 10.6 |

- Mọi số tiền trên Desk vẫn là số máy chủ (mock) trả về. Delta không thêm phép tính tiền nào ở Desk.
- Mock B16 (`mocks/stay.ts`, không đổi trong delta) tính như máy chủ: kiểm W trước, báo trước theo ngày nghiệp vụ lúc báo, hoàn 50 % khi báo trước ≥ 1, dòng phí ghi ngày nghiệp vụ lúc thao tác.
- Trên máy chủ thật, các số này QA chạy giờ thật ở staging theo mục 2.4 (T-11-1…T-11-6).

### 10.5 Bắt báo lại khách lúc qua 00:00 – có đúng cho quầy ca đêm không

**Khi nào hộp đẩy về bước ①.** Chỉ khi ngày đang chọn thành thấp hơn mức sàn mới. Thực tế đó là một ca: hộp mở trước 00:00 với "rời hôm nay" (ngày nghiệp vụ). Ngày rời từ 21/10 trở đi thì bước ② và tick giữ nguyên (P-B), vì số tiền không đổi. Câu "lúc 00:00 bước ② về bước ①" trong lời giao chỉ đúng với ca này. DOM thấy như vậy là đúng.

**Vì sao bắt báo lại là đúng.**
- Qua 00:00, cả ngày rời lẫn số tiền đều đổi. P-A: 23:58 báo khách "không hoàn, phí 2.800.000". Sau 00:00 số đúng là "hoàn 1.050.000, phí 1.050.000, đêm 20/10 tính tiền phòng". Tick "Đã báo khách" lúc 23:58 không còn đúng với số sẽ ghi.
- Không bắt báo lại thì máy chủ cũng trả 409 ở lần ghi, lễ tân vẫn phải quay lại bước ①. Desk chỉ cho thấy sớm điều không tránh được, không thêm bước.
- Mức chênh này do BR-428 (ESC-006) và rules 2.1 (4) đã chốt, không do delta. Vì số đổi nhiều, lễ tân càng phải báo lại.

**Ở OTTIMO 10 căn ca đêm, có gây vấn đề thật không: không.**
- Ca này hiếm: khách báo đi sớm trong vài phút quanh 00:00 mà lễ tân chưa xác nhận xong.
- Thêm khoảng 4 thao tác, dưới 30 giây: "Dùng 21/10" → chờ tính thử → "Xem trước số tiền" → báo khách số mới, tick → "Xác nhận".
- Máy quầy ngủ qua 00:00 (máy tính bảng, laptop gập): khi mở lại tab hoặc chạm vào một ô, hộp đọc lại đồng hồ. Không có lần ghi nào với ngày cũ. P-C: bấm "Xác nhận" ngay lúc 00:02 → về bước ①, 0 lần ghi.
- Không mất dữ liệu đã nhập: giờ báo (23:55 ngày 20/10), ghi chú, ảnh, số OTA vẫn giữ. Giờ báo giữ là đúng, vì đó là lúc khách báo. Báo trước tính theo ngày nghiệp vụ 20/10 nên không đổi.
- Còn một chỗ nhỏ, không mở thẻ: khi hộp tự về bước ①, không có câu nào nói "số tiền sẽ tính lại, báo lại khách". Câu 9.13 chỉ nói đêm đã tính, còn tick bị bỏ thì nhắc gián tiếp. UXD có thể gộp một vế vào thẻ 03 ở v1.0.6 nếu thấy cần.

### 10.6 Delta có làm Desk khác máy chủ không – không

- Thân lệnh B16 không đổi. Desk vẫn chỉ gửi `newDepartureDate`, `noticeGivenAt`, phần OTA hoặc bằng chứng khi máy chủ hỏi. `expected*` lấy từ bản tính thử của đúng thân lệnh đó.
- Hoàn, phí, ngày dịch vụ của dòng phí và số ngày báo trước: chỉ máy chủ tính.
- Mức sàn của Desk = `minCalendarDate` của máy chủ. W của Desk = `inEarlyHours` của máy chủ, thêm điều kiện giờ trước mốc đổi ngày. Thứ tự 409 (`useCheckout` → `minNewDepartureDate` → câu chung) không đổi. `serverMin` vẫn thắng mức sàn của Desk.
- Ngày Desk đề xuất cho "Dùng {date}" là `minDate`, và chỉ hiện khi mức sàn giờ đêm đang quyết ngày tối thiểu. Ngày này luôn là ngày máy chủ nhận, trừ khi đồng hồ máy quầy lệch (ý dưới).
- **Rủi ro còn lại, có từ `52a14957`, không do delta:** đồng hồ máy quầy lệch vài phút so với máy chủ thì trong đúng khoảng lệch đó:
  - quanh 06:00: dòng phụ giờ đêm có thể hiện hoặc mất sớm/muộn vài phút. Không sai tiền;
  - quanh 00:00, máy quầy nhanh hơn: Desk chặn "rời hôm nay" sớm vài phút. Lỗi này đổi tiền chỉ khi khách đã báo từ hôm trước (có bằng chứng), nên rất hiếm;
  - giờ báo mặc định là giờ máy quầy lúc mở hộp (có từ R3, US-137). Máy quầy chậm 2 phút ở 06:00 thì giờ báo ghi 05:59 thay vì 06:01. Máy chủ tính báo trước 1 ngày (hoàn 50 %) thay vì 0. Lễ tân sửa được ô giờ báo.
- **Cách chữa** đúng cho cả ba là cho máy quầy tự đồng bộ giờ, không phải sửa mã. BA ghi một dòng vào sổ tay ca đêm (cùng thẻ 04): "Máy quầy bật đồng bộ giờ tự động; giờ báo là lúc khách báo, sửa nếu khác giờ mở hộp". Không mở thẻ.

### 10.7 Trạng thái thẻ DOM sau delta

| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-DOM-FE-142-01 | **Closed** @ `710209ec` | Mục 10.2. Test đơn vị và ca cả hộp; đột biến "W chỉ theo giờ" bị bắt |
| FB-R5-DOM-FE-142-02 | Deferred – PR riêng sau #142 (ORC chốt) | Phần ô ngày sau 06:00 đã hết nhờ ARC-03. Còn ngày trong dòng phụ có thể chậm 1 ngày. QA ghi bug P2 như đã đề xuất |
| FB-R5-DOM-FE-142-03 | Deferred – chờ chữ UXD | Tùy chọn thêm vế "số tiền sẽ tính lại, báo lại khách" (mục 10.5) |
| FB-R5-DOM-FE-142-04 | Chuyển BA/UXD | Thêm dòng đồng bộ giờ máy quầy (mục 10.6) |

### 10.8 Ghi chú cho vai khác

- **ORC:** gộp #142 sau #114 (`e9dcef63`), cùng tag. CI đang chờ lúc review. Release notes giữ dòng (b) của DOM review #114 mục 4 nếu #142 trễ.
- **QA:** trên staging, chạy giờ thật R1, R2 và P-B quanh 00:00 (ca P-B để chắc bước ② không bị đẩy về khi ngày vẫn hợp lệ), cùng T-11-1…T-11-6.
- **UXD:** thẻ 03, kèm vế tùy chọn ở mục 10.5.
- **BA:** thẻ 04, thêm dòng đồng bộ giờ máy quầy.

### 10.9 Dòng đề xuất ghi `decision-log.md` (ORC ghi khi commit)

`| 2026-11-07 | 5 | **DOM – delta review FE PR #142 (V5-11 Desk) @ 710209ec (52a14957..710209ec): DUYỆT** – DOM-142-01 Closed (W = giờ máy quầy < mốc đổi ngày VÀ ngày nghiệp vụ < ngày lịch; mức sàn = max(ngày nghiệp vụ, ngày lịch) như minCalendarDate của máy chủ; máy quầy chậm ở 05:59 → sàn 21/10, không 22/10); 4 tiêu chí DOM 3.3 cho UXD-142-01 đạt, có test (R1: đơn 19–24/10 × 700.000 → "Dùng 21/10", hoàn 1.050.000, phí 1.050.000 ngày 20/10, khớp rules 2.2 và từ điển 1.5 early_departure_refund {1, 50}; R2 tick 00:02 và P-C bấm Xác nhận 00:02 → về bước ①, 0 lần ghi ngày cũ); hộp chỉ về bước ① khi ngày chọn thấp hơn mức sàn mới (P-B ngày 22/10 giữ bước ② và tick, 700.000/700.000), bắt báo lại khách là đúng vì số đổi (0/2.800.000 → 1.050.000/1.050.000) và máy chủ cũng trả 409, không gây vấn đề cho quầy 10 căn ca đêm; delta không đổi thân lệnh, tiền hay ngày phí so với máy chủ (#114 @ e9dcef63, khối W không đổi); 16/16 ×3, 4 đột biến DOM đều bị bắt; không thẻ mới, không ESC; 02 PR riêng sau #142 (phần ô ngày sau 06:00 đã hết nhờ ARC-03), 03 chờ UXD, 04 BA thêm dòng đồng bộ giờ máy quầy; gộp sau #114, cùng tag | DOM | rounds/round-05/reviews/DOM-on-fe-pr-142.md |`

### 10.10 Điểm làm tốt

- Ba đường cùng dẫn tới câu 9.13: đồng hồ hẹn 00:00, focus vào một ô, cú bấm. Lễ tân không gặp màn "đang tính" mà không tính gì nữa, kể cả khi máy ngủ qua nửa đêm.
- Hộp chỉ bắt báo lại khi số tiền thật sự đổi. Ca ngày vẫn hợp lệ giữ nguyên bước ② và tick, nên lễ tân không phải làm lại vô ích.
- Mức sàn dùng đúng công thức của máy chủ. Nhờ vậy, ca ngày nghiệp vụ chậm sau 06:00 của thẻ 02 cũng hết, không phải chờ PR riêng.
