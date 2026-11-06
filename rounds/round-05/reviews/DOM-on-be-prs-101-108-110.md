# DOM review – PR #101 (V5-30), PR #108 (V5-16 lọc), PR #110 (V5-16 chặn BR-438); trả lời ARC A4, `lease_terms`, BR-111

- Người review: DOM | Round 5 – Review | Ngày: 07/11/2026
- Đối tượng:
  - PR #101, nhánh `r5-h1` @ `02d8e27a` (BE-H);
  - PR #108, nhánh `r5-b1-filter` @ `b5f60440` (BE-B);
  - PR #110, nhánh `r5-b2` @ `c71ae350` (BE-H, draft, đã merge #108);
  - ARC A4 (`rounds/round-05/reviews/ARC-on-be-pr-100-d1.md` mục 4, 6.3);
  - ARC 12.6 ý 1 (`rounds/round-05/reviews/ARC-on-pr-96-v5-25.md`);
  - ARC review #103 mục 3 (BR-111, ORC chuyển 07/11).
- Đối chiếu:
  - BR-111, BR-107, BR-212, BR-438, BR-702, BR-703, BR-903 (`product/docs/business-rules.md` v0.5.13);
  - `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 3, 4, 7.2, 7.3, 13.2;
  - hợp đồng 0.3.13 mục 1.10, 1.19, 1.20;
  - mã: `folio.service.ts` (`syncCommission`, `tryEarnCommissions`), `minibar.service.ts` (`record`), `stay-support.ts` (`replaceLateCharge`), `checkout.service.ts`, `parameter-shapes.ts` (`leaseTermsIssue`);
  - SEC `rounds/round-05/reviews/SEC-on-be-prs-101-108.md` (bản trong checkout 07/11), thẻ V530-01, V516-01.
- Luật đã sửa theo review này:
  - `product/docs/business-rules.md` **v0.5.14**: BR-438, BR-111;
  - `rules-v1.0.5.md`: **mục 14 mới**; mục 0 việc (4); mục 3.1, 3.5, 7.2 ý 3; 12.3; 13.2.
- Không ghi tỷ lệ hay số tiền hoa hồng thật. Không dữ liệu khách.

## 0. Kết luận

| # | Việc | Kết luận DOM |
|---|---|---|
| 1 | PR #101 | **ĐẠT về nghiệp vụ, gộp được.** `rate_missing` (đơn vẫn lưu, không dòng hoa hồng), tỷ lệ 0 → `computed` 0 đ, `lease_terms` bỏ cột hoa hồng: đúng 4.1, 7.3. Thẻ 101-01 (**Major**, không chặn gộp #101, phải xong trước khi gộp PR-M và trước kỳ chốt 01/12): "lần đồng bộ sau" không chắc xảy ra, nên đơn chốt lúc thiếu tỷ lệ có thể không bao giờ có hoa hồng. Thẻ 101-02 (Suggestion) |
| 2 | PR #108 | **ĐẠT, đúng ý 7.2.** `removalsOnly` = `after.amountVnd = 0`; `reductionsOnly` = `after < before`, gồm lần bỏ dòng; bỏ qua `room`, `extra_person`, `room_change_difference`. Thẻ 108-01 (Suggestion, FE) |
| 3 | PR #110 | **ĐẠT về nghiệp vụ.** Đồng ý định nghĩa "dòng nhập tay" của BE-H (dòng A30 hoặc dòng đếm minibar). Dòng trả muộn B13/B15/B16 là dòng hệ thống. Đồng ý cả hai giả định: sửa giảm hợp lệ không phải FOC, không vào hạn mức BR-433; `ShiftReport.lineReductions[]` hoãn sang v1.0.6. DOM sửa chữ BR-438 cho khớp. Đếm lại minibar: **DOM chốt luật cho thẻ SEC V516-01** (mục 3.3), làm ở v1.0.5. Thẻ 110-01 (Minor, v1.0.6). Thẻ QA (Minor): sửa 4 oracle |
| 4 | ARC A4 | **Cần sửa ở v1.0.6 (0.3.14).** Trong cửa sổ sau nửa đêm, lượt còn ở có ngày đi = ngày nghiệp vụ phải lên đầu danh sách "Khách đi", trạng thái `overdue`. v1.0.5 **chấp nhận**, kèm câu sổ tay ca đêm. Thẻ ARC-D1-01 |
| 5 | `lease_terms` khóa dừng thứ 7 | **Đồng ý.** Ô `V525_STOP_KEYS` có 7 khóa. Mục 13.2 đã sửa |
| 6 | BR-111 trên giá gõ | **Đồng ý, đã thêm** vào BR-111 (v0.5.14) và mục 14.5: mã áp trên giá lịch của từng đêm, kể cả giá gõ; ví dụ 700.000 → 665.000 |

---

## 1. PR #101 – V5-30: `commission.status`, `missing[]`, bỏ tỷ lệ khỏi mã

### 1.1 Đối chiếu luật

- **`rate_missing`.** Không có `ratePct`, không có `amountVnd`. Báo giá lưu được, đơn xác nhận được, không có dòng `commission`, không 500. Khớp 4.1 ("không tạo bản ghi 0, không dùng số cũ"), 7.3 và BR-903 (5).
- **Tỷ lệ 0 chủ đầu tư đã lưu → `computed`, 0 đ.** Đúng. 0 là quyết định của chủ đầu tư: loại người hưởng này không có hoa hồng. "Chưa nhập" thì khác.
  - Desk ghi "0 đ", không ghi "Chưa có tỷ lệ hoa hồng".
  - Đơn chụp tỷ lệ 0. `syncCommission` không tạo dòng (điều kiện `ratePct > 0`). Không có dòng 0 đ là đúng, vì không có gì để chi.
  - Chủ đầu tư đổi tỷ lệ sau đó thì đơn cũ vẫn ở 0. Đúng BR-006, như mọi tỷ lệ đã chụp.
  - **Cho PR-M:** mục "Cần chú ý" `commission_rate_missing` chỉ đếm đơn/HĐ có người hưởng mà **chưa chụp tỷ lệ** (null). Đơn chụp 0 không đếm.
- **`lease_terms` bỏ cột hoa hồng; hoa hồng thuê tháng sang khóa riêng ở PR-M.** Đúng 7.3: khoảng hoa hồng không buộc vào khoảng giảm giá.
  - DOM kiểm `git grep` trên `main`: hai cột cũ chỉ có ở `production-defaults.ts` và DS-E. Không mã nào đọc.
  - Hàng production vẫn còn hai cột cũ. Vô hại: `leaseTermsIssue` bỏ qua trường khác, và không mã nào đọc. Lần đổi cấu trúc H7 bỏ hẳn hai cột.
- **`missing[]` theo vai, chỉ tên khóa:** khớp 4.4.

### 1.2 Production còn hàng tỷ lệ cũ – DOM đồng ý thẻ SEC V530-01, thêm hai ý

- #101 chỉ đổi lần khởi tạo mới. Trên production, hàng `short_stay_commission_pct` cũ (hết hiệu lực từ 01/11) vẫn đang có hiệu lực. Vì vậy báo giá và hoa hồng vẫn tính theo tỷ lệ cũ, và Desk không hiện `rate_missing`.
- **Ý 1.** Việc (4) ở mục 0 của `rules-v1.0.5.md` **làm được ngay trên Desk v1.0.4**, vì khóa đã có. Không phải chờ v1.0.5. Mỗi ngày chậm là thêm đơn có người chốt chụp tỷ lệ cũ (BR-006). DOM đã sửa câu ở mục 0.
- **Ý 2.** Đơn có người chốt tạo từ 01/11 tới trước ngày hàng mới có hiệu lực vẫn mang tỷ lệ cũ trên đơn. BR-903 thì đã ghi: từ 01/11 tính theo bảng nội bộ.
  - Bước đếm của SEC V530-01 thêm một số: **số đơn** có người chốt, tạo từ 01/11 tới trước `effective_from` của hàng mới. Chỉ số đơn, không mã đơn, không số tiền.
  - Số khác 0 thì chủ đầu tư chỉnh khi chi kỳ 01/12, theo bảng nội bộ, ngoài Desk (như hoa hồng thuê tháng hiện nay), có ghi chú lý do.
  - Đội **không** sửa tay `commission` hay tỷ lệ đã chụp trên production.

### 1.3 "Lần đồng bộ sau" – xem thẻ 101-01

`syncCommission` chỉ chạy trong đồng bộ lượt ở (`syncStay`): khi xác nhận, đổi đêm/giá/người (B7, B8, B13, B16, sửa số người), đổi căn, đêm thêm B9a/B18.

**Nhận phòng và trả phòng thường không đồng bộ lại.** Hệ quả với đơn chốt lúc chưa có tỷ lệ mà không ai sửa gì:
- tới B18, `tryEarnCommissions` không có dòng `projected` nào để chuyển "đạt";
- sale/CTV không có hoa hồng, và không ai thấy (chỉ có mục "Cần chú ý" của PR-M báo, nếu chủ đầu tư để ý).

Test T30-2 của #101 tạo dòng nhờ một lệnh sửa số người (`PATCH adults`). Ca thật thì không có bước đó.

Ở production hôm nay, ca này chưa xảy ra với đơn ngắn ngày, vì hàng cũ còn (mục 1.2). Nhưng nó **chắc chắn** xảy ra:
- với HĐ thuê tháng ở PR-M: `long_stay_commission` chưa có giá trị lúc lên;
- với mọi lần khởi tạo mới.

Cùng chỗ đó còn một lệch nhỏ với BR-903 (5) "mỗi đơn một tỷ lệ chụp":
- đơn chụp null thì mỗi lần đồng bộ đọc lại tỷ lệ hiệu lực **ngày đồng bộ**;
- chủ đầu tư đổi bảng giữa hai lần đồng bộ (ví dụ gia hạn sau ngày đổi) → dòng cũ bị hủy, dòng mới tạo theo tỷ lệ mới.

---

## 2. PR #108 – V5-16 phần lọc

- **Đúng ý 7.2 (1).**
  - `removalsOnly` = bỏ dòng hoặc giảm về 0 (`after.amountVnd = 0`).
  - `reductionsOnly` = mọi lần làm số tiền nhỏ đi, gồm lần bỏ dòng.
  - Bỏ qua tiền đêm (`room`, `extra_person`, `room_change_difference`). Khớp phạm vi BR-438.
  - Dòng `foc`, `discount`, `adjustment` không sửa được qua `adjustFolioLine`. Vì vậy hủy một dòng FOC (tiền khách tăng) không lọt vào `removalsOnly`. Đúng.
- **Sửa kèm:** bỏ dòng trên folio đang mở nay ghi `folio_line.adjusted`, `after.amountVnd = 0`. Đây đúng là ca chính của A31-01. Nên có, giữ.
- **Bốn khóa dòng gốc** tính trên dòng đầu của chuỗi `related_line_id` (cùng nhóm dòng). Khớp 7.2 (2) và BR-438-05.
- **Bộ lọc thấy cả lần giảm của quản lý, chủ đầu tư.** BR-438 (4) chỉ đòi lần giảm của FD/FDL. Thấy thêm thì có ích cho chủ đầu tư, không trái luật.
- **"7 ngày" theo `occurred_at`**, tức ngày lịch, không theo ngày nghiệp vụ. Lần sửa lúc 00:00–05:59 rơi vào ngày lịch hôm sau. Chấp nhận cho một bộ lọc xem lại theo tuần.
- **BR-438 (4)(ii) "lọc theo người và loại dòng":** máy chủ có lọc theo người (`actorUserId`), không có lọc theo loại dòng. Xem thẻ 108-01. Không cần đổi máy chủ.

---

## 3. PR #110 – V5-16 chốt chặn BR-438

### 3.1 Định nghĩa "dòng nhập tay" – DOM đồng ý

Luật nói về **người gõ số lượng hay giá**. Còn `source` chỉ là cách mã lưu nguồn của dòng. Đối chiếu mã:

| Dòng | `source` lưu | "Nhập tay" theo BR-438? |
|---|---|---|
| Thêm dòng phát sinh A30: dọn lẻ, giặt ủi, phạt (hút thuốc, thẻ phòng), hư hỏng (trong bảng và ngoài bảng), F&B, dịch vụ | `manual` | **Có** |
| Đếm minibar (`recordMinibarCheck`) | `minibar_check` | **Có**: người đếm gõ số còn lại. Đúng ví dụ minibar ở DOM 3.3 |
| Phụ thu trả muộn khi đặt giờ trả muộn, gia hạn, trả sớm (B15, B13, B16 – `replaceLateCharge`) | `manual` | **Không** (luồng Desk tự tính) |
| Phụ thu trả muộn lúc Trả phòng (B18) | `checkout` | Không |
| Phụ thu nhận sớm | `checkin` | Không |
| Phí hủy, phí không đến, phí trả sớm, tiền thừa giữ lại | `system` / `checkout` | Không |
| Chênh đổi căn | `manual` | Ngoài BR-438 (tiền đêm) |
| Phí từ yêu cầu khách | `guest_app` | Không |

- Danh sách A30 lấy đúng danh mục `addFolioLine`, có test giữ hai bên bằng nhau. Sau này thêm món vào danh mục thì luật tự theo.
- DOM sửa chữ:
  - BR-438 (1)(a) và (2) bỏ cụm "nguồn `manual`", ghi theo bảng trên (v0.5.14);
  - `rules-v1.0.5.md` 3.1 và 7.2 ý 3.
- Hợp đồng 0.3.13 mục 1.20 cũng ghi "`source = manual`". ARC sửa chữ ở ARC-16 hoặc 0.3.14. Hành vi không đổi.

### 3.2 Hai giả định của BE-H – DOM đồng ý

1. **Sửa giảm hợp lệ của FD/FDL là sửa sai, không phải FOC.** Không có dòng FOC, không vào FOC tháng, không vào hạn mức BR-433. Đúng câu cuối BR-438 (1). Mỗi lần vẫn được đếm vào `line_reduction_count`.
   - FOC lý do `entered_in_error` ("Ghi nhầm") thì vẫn là FOC: tính FOC tháng và hạn mức BR-433. Đúng, vì đó là đường cho dòng không phải của mình.
   - Bill in cho khách chỉ ghi "Miễn phí": đúng UXD copy 9.5 mà DOM đã xác nhận ở 3.6.
2. **`ShiftReport.lineReductions[]` hoãn sang v1.0.6.** DOM 7.2 ý 4 đã cho phép, vì chưa có `getShiftReport` hay bảng ca. Tới v1.0.6:
   - quản lý xem bộ lọc "Sửa giảm dòng – 7 ngày";
   - BA thêm vào sổ tay đóng ca: "Trước khi giao ca, mở Nhật ký, lọc **Sửa giảm dòng** của mình hôm nay, báo người nhận ca các dòng đã sửa". FD chỉ thấy bản ghi của mình (`x-scope own`), nên làm được;
   - QA chuyển ý "có trong đóng ca" của T-16-1 / BR-438-01 sang v1.0.6.

### 3.3 Đếm lại minibar – DOM chốt luật cho thẻ SEC FB-R5-SEC-BE-V516-01

Đây là **BR-438 áp cho đường thứ hai**, không phải luật mới. DOM đồng ý cả hai ý của SEC:
- ý 1 (chặn) là luật, đích là **v1.0.5**;
- ý 2 (audit) là mức tối thiểu.

ORC đã giao việc này cho BE-A2 (PR `r5-v516-minibar`, xếp trên #110; decision-log 07/11). Nếu ý 1 không kịp tag v1.0.5, DOM chấp nhận chỉ có ý 2 tới v1.0.6, kèm hai việc tạm:
- sổ tay lễ tân (BA): "Không đếm lại minibar thấp hơn số buồng phòng hay lễ tân khác đã đếm. Khách không nhận thì Gửi miễn có duyệt";
- quản lý xem bộ lọc 7 ngày mỗi tuần, chú ý các dòng `minibar_recount` do FD/FDL làm.

Không có hai ý này thì ví dụ BR-438-02 vô nghĩa: Lan chỉ cần đếm lại 2 thay vì gửi FOC. Ở OTTIMO, minibar là khoản phát sinh hay thu tiền mặt nhất.

Chi tiết nghiệp vụ (đã ghi vào BR-438 (2a) v0.5.14 và `rules-v1.0.5.md` 14.1):

1. **Xét từng món.** Món có số tiền mới nhỏ hơn dòng đang sống của món đó là một lần sửa giảm. Người ghi và ngày ghi lấy theo dòng gốc (`rootLineOf`, như #110): dòng FD đã sửa bằng Điều chỉnh vẫn về dòng đếm ban đầu.
2. **FD/FDL** được đếm thấp hơn khi dòng gốc do chính mình đếm hoặc ghi trong ngày nghiệp vụ hiện tại.
   - Ngoài đó: máy chủ từ chối **cả lần đếm**, không ghi gì (kể cả `minibar_check`). Desk nêu món nào và cho hai lối:
     - **Gửi miễn có duyệt**: FOC minibar tự áp trong hạn mức BR-436. Lý do "Ghi nhầm" (`entered_in_error`) nếu lần đếm trước sai, "Bù sự cố" (`service_recovery`) nếu khách không nhận mà lễ tân chấp nhận;
     - **nhờ buồng phòng đếm lại.**
   - UXD viết câu, ví dụ: "Số đếm của {món} thấp hơn số đã đếm trước. Gửi miễn có duyệt, hoặc nhờ buồng phòng đếm lại."
3. **Như cũ:** lần đếm giữ dòng (R6: cùng số lần trước hoặc cùng số trên folio), lần đếm tăng, lần đếm đầu.
4. **Buồng phòng, quản lý, chủ đầu tư** đếm lại như cũ.
   - Mọi lần đếm làm dòng nhỏ đi (mọi vai) ghi **một** `folio_line.adjusted`, `reason: minibar_recount` (SEC ý 2), để có trong bộ lọc 7 ngày.
   - Chỉ lần của FD/FDL đếm vào `line_reduction_count`.
5. **Ca thường ở quầy.**
   - Buồng phòng đếm lúc dọn trả phòng. Lễ tân xác nhận lần đếm ở bước Trả phòng (BR-703), với số buồng phòng đã điền sẵn.
   - Khách nói "chỉ uống 2" mà buồng phòng đếm 3: lễ tân không hạ số được, mà gửi FOC 35.000 tự áp.
   - Tốn thêm một lần bấm. Đổi lại, phần miễn hiện ở báo cáo FOC.

Ví dụ: buồng phòng Minh đếm căn 202 lúc 10:00 ngày 12/11: 3 bia × 35.000 = 105.000.
- 11:00 lễ tân Lan đếm lại còn 2 → **bị chặn**. Lan gửi FOC 35.000, tự áp trong hạn mức → bill minibar **105.000**, FOC **−35.000**.
- Minh đếm lại → **70.000**, có trong bộ lọc 7 ngày.
- Lan tự đếm lúc 10:00, 10:20 đếm lại còn 2 → **được**, có trong bộ lọc và `line_reduction_count`.

**Trả lời câu SEC (đếm thấp hơn thực tế có làm bổ sung tủ thiếu không):**
- **Có thể**, nếu người bổ sung chỉ nạp theo số món trên việc. Khi đó tủ thấp hơn chuẩn, nhưng lần nạp vẫn ghi về chuẩn (BR-703). Khách sau bị tính món khách trước dùng.
- Điểm 2 ở trên đóng phần lớn ca này, vì FD/FDL không hạ được số người khác đã đếm.
- Phần còn lại là thao tác. BA ghi vào sổ tay buồng phòng: "Bổ sung tủ: luôn nạp đủ định mức theo bảng trong căn, không theo số món trên việc. Thiếu nhiều hơn số trên việc thì báo lễ tân trước khi bấm Xong."
- QA thêm một ca thăm dò, không chặn.

### 3.4 Dòng hư hỏng ngoài bảng đã được quản lý duyệt giá – thẻ 110-01

- Dòng hư hỏng ngoài bảng do FD gõ, quản lý duyệt giá (`pending_approval` → `posted`, BR-512). Theo #110, dòng này vẫn là "nhập tay của FD", nên FD giảm thẳng được trong ngày.
- Về nghiệp vụ, giá đó là **quyết định của quản lý**. Khách thương lượng lại giá đền bù là một lần miễn, phải qua FOC hoặc quản lý.
- Ca hiếm, và lần giảm vẫn có trong bộ lọc 7 ngày. Nên để v1.0.6.

### 3.5 Oracle QA phải sửa – thẻ QA-BR438-01

Ý ca và kết quả mong đợi của các oracle đều đúng luật. Chỉ ô `source` ghi lệch với mã. Không đổi `expected`.

| Oracle | Hiện ghi | Sửa thành | Ghi chú |
|---|---|---|---|
| BR-438-01 | `line.source: "manual"` (minibar) | `"minibar_check"` | dòng đếm minibar là "nhập tay" |
| BR-438-02 | `line.source: "manual"` (minibar) | `"minibar_check"` | như trên |
| BR-438-05 | `root.source: "manual"` (minibar) | `"minibar_check"` | bước B sửa tăng tạo dòng thay thế `manual`; gốc vẫn là dòng đếm |
| BR-438-04 | `line.source: "system"` (late_checkout, "khi chính lễ tân đó bấm Trả phòng") | `"checkout"` | B18 lưu `checkout` |
| **BR-438-07** (mới) | – | late_checkout `source: "manual"` từ B15 (đặt giờ trả muộn trước), `postedBy: actor` → FD chặn, FDL chặn, MGR được, `hint: foc_request` | khớp T16-10 / H-08 của #110 |
| **BR-438-08** (mới, khi BE làm mục 3.3) | – | ví dụ minibar 3.3: Lan đếm thấp hơn số Minh → 403 `foc_request`, không ghi gì; Minh đếm lại → được, có `folio_line.adjusted` `minibar_recount`; Lan đếm lại lần mình đếm trong ngày → được | |

- Nên thêm một khóa `typedByHand: true/false` vào `input.line` của các oracle BR-438, để người đọc không phải suy từ `source`.
- Bảng ca T-16-x (`rules-v1.0.5.md` 3.5) đã thêm T-16-12 (B15) và T-16-13…15 (đếm lại).

---

## 4. ARC A4 – lượt đi hôm qua còn ở, trong cửa sổ sau nửa đêm

**Có cần không: có.** Sửa ở **v1.0.6 (0.3.14)**. v1.0.5 chấp nhận như #100, kèm câu sổ tay. Thẻ ARC-D1-01.

Vì sao cần:
- Việc của ca đêm, trước khi qua ngày nghiệp vụ mới, là rà mọi lượt có ngày đi hôm nay: trả phòng hoặc gia hạn. Đây là việc chuẩn của kiểm toán đêm ở quầy.
- Lễ tân ca đêm là người cuối cùng làm được việc này mà không cần quản lý. Từ 06:00, lượt đó thành "quá ngày đi", chỉ OWN/MGR (V5-15), và audit ghi `nightsNotBilled = 1` dù khách có thể đã đi từ chiều hôm trước.
- Trước #100, lượt này có trong danh sách lúc 01:30. #100 làm mất nó để hiện khách đi sáng nay. Cả hai đều cần: lấy cả hai, không phải chọn một.

Vì sao v1.0.5 chấp nhận được:
- Không ai mất tiền: căn vẫn "Đang ở" trên sơ đồ phòng, quản lý trả phòng được trên điện thoại (V5-15), phụ thu tính theo giờ khách rời thật.
- 10 căn: lễ tân thấy được trên sơ đồ phòng nếu biết phải xem.

Luật cho 0.3.14 (DOM đề xuất, ARC chốt hợp đồng):
- Trong cửa sổ sau nửa đêm (00:00 tới trước `business_day_rollover`), khi vắng `date`, danh sách "Khách đi" gồm:
  1. lượt đi theo ngày lịch (`departuresDate`, như #100);
  2. **thêm** lượt còn `in_house` có ngày đi hiệu lực (`stayDepartureDate`, gồm gia hạn B13 và đơn con gia hạn) = ngày nghiệp vụ. Nhóm này **đặt trên cùng**, trạng thái `overdue` (Desk đã có `stay.card_overdue`), nút Trả phòng như thường.
- Lượt có ngày đi trước ngày nghiệp vụ thuộc V5-15 (lọc `overdueOnly`), không đưa vào đây.
- Ô "Khách đi" (A3 phần máy chủ) đếm cả nhóm 2 là "chưa trả phòng".

Câu sổ tay ca đêm cho v1.0.5 (BA): "Trước 06:00, mở Sơ đồ phòng. Căn nào Đang ở mà ngày đi là hôm qua theo lịch: kiểm căn hoặc hỏi buồng phòng, rồi bấm Trả phòng (ghi giờ khách rời thật) hoặc Gia hạn."

---

## 5. `lease_terms` – khóa dừng Release thứ 7 (ARC 12.6 ý 1)

**DOM đồng ý.** Ô `V525_STOP_KEYS` của runbook v1.0.5 có **7 khóa**: `min_stay`, `weekend_nights`, `special_dates`, `los_discount`, `weekend_uplift_channels`, `special_uplift_channels`, `lease_terms`.

- Luật đích của DOM 13.2 cho `lease_terms` hỏng là "bỏ khối So sánh, báo giá vẫn ra". Nhưng v1.0.5 **chưa có** đọc phòng thủ đó (R5-B-05).
- Tới đó, giá trị hỏng làm **cả báo giá** từ `long_stay_compare_from_nights` đêm trở lên trả 500. Đó là các đơn ngắn ngày dài nhất, giá trị cao nhất. Nghĩa là dừng bán, cùng loại với sáu khóa kia (nguyên tắc 13.2 (1) và (3)).
- Sửa trên Desk mất vài phút. Giá trị production đọc ngày 06/11 hợp lệ. Câu SQL đã kiểm khóa này, nên không phải sửa hay ghim lại SQL.
- DOM đã sửa mục 13.2. ORC sửa ô `V525_STOP_KEYS` của runbook và ghi decision-log. PO giữ "đọc phòng thủ `lease_terms`" trong R5-B-05.

---

## 6. BR-111 – mã khách quay lại trên giá gõ (ARC review #103 mục 3)

**DOM đồng ý, đã thêm vào BR-111 (v0.5.14) và `rules-v1.0.5.md` 14.5.**

- Mã áp trên **giá lịch của từng đêm**, kể cả đêm lễ tân gõ giá.
  - Giá gõ là giá lịch, tính trước bậc (BR-107 v0.3.8).
  - Mã là mức **thay cho bậc** (không cộng dồn, lấy mức có lợi hơn cho khách), nên áp trên cùng cơ sở với bậc.
- Đêm không gõ (`edited: false`) dùng giá lịch của máy chủ.
- Làm tròn theo `rounding.night_rate`, như bậc.
- Ví dụ: đêm gõ 700.000, mã −5 % → **665.000**.
- Lễ tân muốn khách trả đúng một số thì gõ giá **trước** mã.

Không đổi mức −5 % hay tên mã. Hai thứ này vẫn là [GIẢ ĐỊNH – chờ INV xác nhận].

Ghi chú nhỏ của ARC về `rules-v1.0.5.md` 12.3: DOM bỏ số dòng, chỉ ghi tên tệp và hàm `readMinStay`, vì số dòng đổi theo từng PR.

---

## 7. Thẻ feedback

### FB-R5-DOM-BE-101-01
- Mức độ: **Major** (không chặn gộp #101; phải xong trước khi gộp PR-M và trước kỳ chốt 01/12)
- Vị trí: `folio/public/folio.service.ts` `syncCommission` (chỉ gọi từ `syncStay`), `tryEarnCommissions`; PR #101 mô tả "Lần sync sau … dòng hoa hồng được tạo"; PR-M (HĐ thuê tháng, đợt 1)
- Vấn đề: đơn chốt khi `rate_missing` chỉ có dòng hoa hồng nếu sau đó đơn được đồng bộ lại (đổi đêm, giá, người, căn). Nhận phòng và trả phòng thường không đồng bộ. Tới B18, `tryEarnCommissions` không có dòng để chuyển "đạt", nên sale/CTV không có hoa hồng mà không ai thấy. Thêm nữa, đơn chưa chụp tỷ lệ thì mỗi lần đồng bộ đọc lại tỷ lệ của ngày đó: đổi bảng rồi gia hạn → hoa hồng bị tính lại theo tỷ lệ mới (lệch BR-903 (5)). Test T30-2 chỉ tạo dòng nhờ một lệnh `PATCH adults`.
- Vì sao quan trọng: sai tiền của nhân viên (thiếu hoa hồng), phát hiện muộn ở kỳ chi. Với PR-M, ca này chắc chắn xảy ra, vì `long_stay_commission` chưa có giá trị lúc lên. Ở production hôm nay, đơn ngắn ngày chưa gặp vì hàng tỷ lệ cũ còn hiệu lực (mục 1.2).
- Đề xuất sửa (BE-H; ARC chọn chỗ đặt):
  1. **Bắt buộc:** trước mỗi lần xét "đạt" (`tryEarnCommissions`: B18, đối soát, thu công nợ), đơn có người hưởng, chưa chụp tỷ lệ và không có dòng `projected` thì chạy đồng bộ hoa hồng theo tỷ lệ hiệu lực ngày đó. Vẫn thiếu tỷ lệ thì vẫn không có dòng, vẫn ở "Cần chú ý".
  2. **Bắt buộc:** lần đầu tạo dòng theo tỷ lệ ngày đồng bộ thì ghi tỷ lệ đó vào tỷ lệ chụp của đơn. Từ đó đơn giữ một tỷ lệ (BR-903 (5)), lần đồng bộ sau chỉ đổi cơ sở.
  3. **Nên:** khi chủ đầu tư lưu khóa tỷ lệ, đồng bộ luôn các đơn đã xác nhận, chưa trả phòng, có người hưởng, chưa có dòng, để màn Hoa hồng đúng ngay. Ở 10 căn chỉ vài đơn.
  4. PR-M áp cùng luật cho HĐ: HĐ ký khi thiếu `long_stay_commission` phải có bản ghi đợt 1 chậm nhất lúc đợt 1 "đạt".
  5. Test: đơn chốt khi thiếu tỷ lệ, không sửa gì; chủ đầu tư lưu `test_rate_short`; trả phòng, thu đủ → có dòng `earned`, tỷ lệ = `test_rate_short`, đơn chụp `test_rate_short`. Đổi bảng sang `test_rate_short_2` rồi gia hạn → dòng mới vẫn dùng `test_rate_short`.
- Trạng thái: Open

### FB-R5-DOM-BE-101-02
- Mức độ: Suggestion
- Vị trí: `sales/internal/quote-pricing.ts` (`ottimoRemainingVnd: totalVnd - (commission.amountVnd ?? 0)`); `quote.ottimo_remaining_vnd`
- Vấn đề: khi `rate_missing`, "phần còn lại của OTTIMO" = tổng tiền, tức như hoa hồng 0. Desk hiện ẩn dòng này khi không có `amountVnd`: đúng, giữ.
- Vì sao quan trọng: số lưu ở báo giá đọc như số đã trừ hoa hồng. DATA hay báo cáo sau này dùng số đó sẽ sai, trái nguyên tắc 4.1 "không tính 0".
- Đề xuất sửa: 0.3.14 cho `ottimoRemainingVnd` vắng (và cột lưu null) khi `rate_missing`. Tới đó DATA không dùng `quote.ottimo_remaining_vnd` của báo giá có `commission_vnd` null mà có người hưởng.
- Trạng thái: Open

### FB-R5-DOM-BE-108-01
- Mức độ: Suggestion (FE-A, ORC chuyển)
- Vị trí: Desk Nhật ký / bộ lọc "Sửa giảm dòng – 7 ngày" (BR-438 (4)(ii)); `listAuditEvents?reductionsOnly=true`
- Vấn đề: BR-438 (4)(ii) đòi lọc theo người **và loại dòng**. Máy chủ có `actorUserId`, không có lọc theo loại dòng.
- Vì sao quan trọng: quản lý cần thấy ngay "ai giảm minibar nhiều", "ai bỏ phí giặt".
- Đề xuất sửa:
  - Desk có lối tắt "Sửa giảm dòng – 7 ngày" = `reductionsOnly=true` cho 7 ngày gần nhất;
  - lọc loại dòng phía Desk theo `before.category`: một tuần của 10 căn chỉ vài chục bản ghi;
  - cột hiện vai lúc sửa (`before.actorRole`), số trước → sau, lý do.
  - Không đổi máy chủ.
- Trạng thái: Open

### FB-R5-DOM-BE-110-01
- Mức độ: Minor (v1.0.6)
- Vị trí: `folio/public/line-reduction.ts` `typedByHand`; `folio-lines.service.ts` `addFolioLine` nhánh `damage` ngoài bảng (`pending_approval` → `onDamageDecided`)
- Vấn đề: dòng hư hỏng ngoài bảng do FD gõ, quản lý duyệt giá, vẫn là "nhập tay của FD". Vì vậy FD giảm thẳng được trong ngày.
- Vì sao quan trọng: giá đền bù ngoài bảng là quyết định của quản lý (BR-512). Hạ giá sau khi khách thương lượng là một lần miễn, phải có người duyệt.
- Đề xuất sửa: dòng gốc đã qua duyệt giá (có yêu cầu `damage_pricing` được duyệt) không tính là "nhập tay" với FD/FDL → 403 `foc_request`. Tới đó lần giảm vẫn có trong bộ lọc 7 ngày.
- Trạng thái: Open

### FB-R5-DOM-QA-BR438-01
- Mức độ: Minor (sửa trước khi QA chạy ca V5-16 trên staging)
- Vị trí: `product/tests/fixtures/br-examples.json` BR-438-01, -02, -04, -05
- Vấn đề: ô `source` lệch mã. Minibar ghi `manual` (mã: `minibar_check`). Trả muộn lúc Trả phòng ghi `system` (mã: `checkout`; B15/B13/B16: `manual`). Thiếu ca trả muộn `manual` và ca đếm lại minibar.
- Vì sao quan trọng: test dựng theo oracle sẽ đặt sai nguồn dòng và kết luận sai về chốt chặn.
- Đề xuất sửa: theo bảng mục 3.5 (sửa 4 ô, thêm BR-438-07; BR-438-08 khi BE làm đếm lại). Nên thêm khóa `typedByHand`. Không đổi `expected` của các dòng cũ. Chạy `validate-fixtures.mjs`.
- Trạng thái: Open

### FB-R5-DOM-ARC-D1-01
- Mức độ: Minor (0.3.14 / v1.0.6)
- Vị trí: `getArrivalsDepartures` khi vắng `date`, trong cửa sổ sau nửa đêm (hợp đồng 0.3.13 mục 1.19 ý 02; PR #100 `departuresDateFor`); ô "Khách đi" `TonightKpi` (A3)
- Vấn đề: lượt `in_house` có ngày đi = ngày nghiệp vụ không còn ở danh sách "Khách đi" lúc 00:00–05:59 (ARC A4).
- Vì sao quan trọng: ca đêm là lần cuối lễ tân tự trả phòng được. Sau 06:00 phải gọi quản lý, và audit ghi một đêm không thu dù khách đã đi.
- Đề xuất sửa: theo mục 4 (thêm nhóm 2 lên đầu, `overdue`; ô đếm theo cùng quy tắc). v1.0.5: BA thêm câu sổ tay ca đêm ở mục 4. QA v1.0.6: lượt đi 16/10 còn ở, lúc 01:30 ngày 17/10 có trên cùng, `overdue`, Trả phòng được; lúc 06:10 không còn, đi đường V5-15.
- Trạng thái: Open

---

## 8. Điểm làm tốt

- #110 dùng **một** bộ dữ kiện dòng gốc (`rootLineOf` + `reductionScope`) cho cả audit lẫn chốt chặn. Quản lý đọc audit là biết vì sao một lần giảm được phép.
- BE-H tự nêu chỗ oracle lệch mã và đường đếm lại minibar, thay vì im lặng làm theo chữ. Nhờ vậy BR-438 đóng được cả đường thứ hai.
- #101 tách "chưa nhập" (`rate_missing`) với "chủ đầu tư chọn 0" (`computed` 0 đ). Hai ca này Desk phải nói khác nhau, và mã đã làm đúng.

## 9. Giả định DOM dùng

- Đọc mã trên các nhánh PR qua `git show`, không chạy test.
- "Nhận phòng, trả phòng thường không đồng bộ lại hoa hồng" là DOM đọc từ các chỗ gọi `resyncStay`. BE xác nhận khi sửa thẻ 101-01.
- Cách nạp tủ (theo việc hay nạp đủ) DOM chưa kiểm trên mã. Câu trả lời ở 3.3 viết theo điều kiện "nếu".
- Không có ESC mới. Mọi điểm ở đây thuộc quyền DOM (nghiệp vụ theo chuẩn ngành) hoặc thi hành chính sách INV đã quyết (bảng nội bộ 01/11).
