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
