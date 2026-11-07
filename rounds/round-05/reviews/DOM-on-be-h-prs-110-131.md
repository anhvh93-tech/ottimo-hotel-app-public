# DOM review – BE-H PR #110 (V5-16, BR-438) và PR #131 (V5-30, hoa hồng ở mốc "đạt")

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng:
  - PR #110, nhánh `r5-b2` @ **`e870a1c9`** (draft). Lần trước DOM đọc @ `c71ae350` (`DOM-on-be-prs-101-108-110.md`). Từ đó có `a615eaf2` (cổng `audit/public/line-reductions`, 05:59/06:00, ca dòng đếm minibar), `b2243f40` (tệp mới `test/integration/v5-16-br438-checkout.test.ts`) và hai lần gộp `main`.
  - PR #131, nhánh `r5-h1b` @ **`0594d165`** (draft), làm thẻ FB-R5-DOM-BE-101-01 theo chỗ đặt ARC chọn (H1-03), cùng ARC H1-01, H1-02.
- Đối chiếu:
  - oracle `product/tests/fixtures/br-examples.json` **v0.5.16** (BR-438-04, BR-438-07 `carryToCheckout`);
  - `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 3, 4.2–4.4, 7.2, 7.3, 14.1, 14.2, 15.5;
  - BR-438, BR-433 (e), BR-525 (iii) và R7LOCK-02 (4), BR-903 (1)–(5), BR-212 (`product/docs/business-rules.md` v0.5.15);
  - sổ tay BA `da596507`: `product/docs/manual/guides/01-chu-dau-tu-quan-ly.md` mục 2.1 (dòng "Mỗi tuần"), 8.1 (bộ lọc **Sửa giảm dòng – 7 ngày**), so với bản trên `main` hiện nay (thêm ô **Người làm** và câu mở từ **Cần chú ý** của #128);
  - plan `rounds/round-05/plan.md` mục 4a dòng T3, T5, T6; PR #133 (`r5-v516-minibar` @ `0636f2fc`, draft, xếp trên #110).
- DOM đọc mã bằng `git show` / `git diff` ở đúng SHA trên, không chạy test.
- Không ghi tỷ lệ hay số tiền hoa hồng, thưởng. Ví dụ hoa hồng chỉ dùng `test_rate_short`, `test_rate_short_2`. Giá 700.000 là số ví dụ của BR-412. Không dữ liệu khách.

## 0. Kết luận

| PR | SHA | Kết luận DOM | Thẻ |
|---|---|---|---|
| #110 | `e870a1c9` | **DUYỆT.** BR-438-04 và 3 lần chạy `carryToCheckout` khớp oracle v0.5.16 từng ô. Bộ lọc **Sửa giảm dòng – 7 ngày** và số **Cần chú ý** `line_reduction_count` khớp sổ tay `da596507`. Câu sổ tay về lần đếm lại minibar chỉ đúng khi **#133** cùng tag: #110 một mình không làm lần đếm lại hiện trong bộ lọc | 110-02 (Minor, BA + ORC/PO, trước khi cắt tag), 110-03 (Suggestion), 110-04 (Suggestion). 110-01 vẫn Open, v1.0.6 |
| #131 | `0594d165` | **DUYỆT.** Mốc "đạt", ghim tỷ lệ, chạy lại không thêm bản ghi, khóa tỷ lệ chỉ OWN/MGR, luật lưu: đúng 7.3, 14.2, 15.5. Thẻ 101-01 ý (1), (2) đạt; ý (3) "Nên" chưa làm, DOM chấp nhận. Đề xuất ORC đóng 101-01 khi #131 gộp | 131-01 (**Major**, không chặn gộp #131, xong trước kỳ chốt 01/12), 131-02, 131-03, 131-04 (Minor, v1.0.6) |

Không có ESC mới. Mọi điểm dưới đây là đúng nghiệp vụ theo BR đã có (BR-903, BR-212, BR-525) hoặc theo câu sổ tay đã duyệt.

---

## 1. PR #110 @ `e870a1c9`

### 1.1 BR-438-04 (T-16-4) so với oracle v0.5.16

Ca test: căn 201, đêm cuối gõ 700.000, đã thu đủ lúc nhận phòng. Hạnh (FD) bấm Trả phòng 15:00 ngày đi, trả phần còn lại → dòng trả muộn B18 210.000 trên folio `settled`.

| Ô oracle | Test | Khớp |
|---|---|---|
| `line`: `late_checkout`, `source: checkout`, `postedBy` = người bấm Trả phòng, 210.000 | đọc `folio_line`: `source checkout`, `posted_by` = Hạnh, 210.000 | Có |
| `folioStatus: settled`, `paidInFullAtCheckout: true` | `folio.status = settled`; B18 trả phần còn lại bằng tiền mặt | Có |
| FD, FDL: 403 `FORBIDDEN_ACTION`, `requiredFlowInBody: false` | Hạnh, FDL: 403, `code` đúng, thân **không có** `requiredFlow` | Có |
| `accessDeniedBr438PerRefusal: 0` | số `access.denied` lý do `BR-438` không đổi sau mỗi lần | Có |
| `folioUnchangedWhenRefused` | `version` và toàn bộ `lines` không đổi | Có |
| MGR 201; `auditAfterReducedVnd` 210.000 | 201; `folio_line.adjusted` `after.reducedVnd` 210.000 | Có |
| `settledReductionVnd` 210.000, vai `manager` | đúng **một** dòng `folio_settled_reduction` {210.000, `manager`} | Có |
| hoàn tự sinh 210.000, người gửi MGR, ghi chú bắt đầu "Tự sinh từ A32" | khớp cả ba | Có |
| `refundApproverNot: same_manager` | chính MGR duyệt → 403 | Có |

Đúng nghiệp vụ: Trả phòng chốt folio, nên dòng trả muộn B18 là khoản sau trả phòng. Miễn khoản này là một lần miễn của quản lý (BR-433 (e)), có hoàn tự sinh và người duyệt khác. Lễ tân không thấy gợi ý "Gửi miễn" vô dụng trên folio đã chốt. Thứ tự kiểm ở mã (A32 trước BR-438, `folio-lines.service.ts` `adjust`) đúng như DOM chọn phương án A.

### 1.2 BR-438-07 `carryToCheckout` – 3 lần chạy

FOC do Hạnh (FD) gửi lúc đặt giờ trả muộn (B15), lý do do QA chọn. Giá đêm cuối 700.000: 15:00 = 210.000 (30 %), 17:00 = 350.000 (50 %).

| Lần | Oracle | Test | Khớp |
|---|---|---|---|
| 1 | B15 15:00, FOC 210.000 FDL duyệt → B18 17:00, lễ tân xác nhận phụ thu tăng: dòng sống 350.000 `checkout`, dòng B15 bị đảo, FOC 210.000, khách trả 140.000 | căn 101, đúng từng số; người duyệt `fdl` | Có |
| 2 | B15 17:00, FOC 350.000 MGR duyệt → B18 15:00: dòng 210.000 `checkout`, B15 bị đảo, FOC 210.000, khách trả 0 | căn 102, người duyệt `mgr` | Có |
| 3 | B15 15:00, FOC 210.000 FDL duyệt → B18 15:00: **giữ** dòng B15 (`manual`, không đảo), FOC 210.000, khách trả 0 | căn 103 | Có |
| Mỗi lần | 1 yêu cầu FOC, không duyệt lần hai, `approvalEffectiveVnd` 210.000, folio `settled` | `focRequests` đúng 1 dòng `approved`; `effectiveAmountVnd` 210.000; `settled`; còn phải thu 0 | Có |

Đúng nghiệp vụ:
- Lần 1: FOC giữ đúng số đã duyệt, không tự nâng lên theo giờ rời thật. Khách ở thêm 2 giờ thì trả phần tăng 140.000. Người duyệt chỉ chịu trách nhiệm số mình đã duyệt.
- Lần 2: FOC hạ theo dòng mới, không miễn quá số phải thu.
- Lần 3: rời đúng giờ đã đặt thì không ghi lại dòng.

Test luôn gửi `applyLateSurcharge` khi tóm tắt có phụ thu, kể cả lần 2, 3. Lần 3 vẫn giữ dòng `manual`, tức cờ này không ép ghi lại khi số không đổi. Kết quả vẫn đúng oracle.

### 1.3 Bộ lọc **Sửa giảm dòng – 7 ngày** và số **Cần chú ý** so với sổ tay BA (`da596507`, mục 8.1 và dòng "Mỗi tuần" ở 2.1)

Danh sách (bộ lọc) và số đếm (**Cần chú ý**) nay dùng **cùng một** mệnh đề `lineReductionWhere` (`audit/public/line-reductions.ts`), nên không thể lệch về định nghĩa "sửa giảm".

| Sổ tay ghi | Mã @ `e870a1c9` | Khớp |
|---|---|---|
| Mọi lần một dòng phát sinh bị làm nhỏ đi: bỏ dòng, giảm số lượng, giảm giá | `action = folio_line.adjusted` và `after.amountVnd < before.amountVnd`. Mọi đường `adjustFolioLine` (folio mở, folio đã chốt trong hạn nợ, A32) đều ghi đủ hai số | Có |
| … đếm lại minibar thấp hơn (lý do **Đếm lại minibar**) | #110 **không** ghi gì cho lần đếm lại. Chỉ #133 thêm `folio_line.adjusted` lý do `minibar_recount` | **Chỉ khi có #133** – mục 1.4 |
| Có cả lần sửa của quản lý, chủ đầu tư | danh sách không lọc vai | Có |
| Không gồm tiền đêm | loại `room`, `extra_person`, `room_change_difference` theo `after.category` | Có |
| 7 ngày theo ngày lịch; lần sửa 00:00–05:59 ở ngày lịch hôm sau | lọc theo `occurred_at` | Có |
| Mở từ **Cần chú ý**: cả tháng của người đó; cảnh báo theo ngày nghiệp vụ, danh sách theo ngày lịch, nên có thể lệch vài lần sửa lúc 00:00–05:59 đầu hoặc cuối tháng | số đếm từ `business_day_rollover` ngày 1 của tháng nghiệp vụ tới lúc đọc; link `month=YYYY-MM&actorUserId=…` là tháng lịch | Có |
| "vượt ngưỡng" | đếm **lớn hơn** `foc_alert_count_per_approver` (ngưỡng 10 → lần thứ 11 mới báo, BR-438-06) | Có |
| Chỉ chủ đầu tư thấy dòng cảnh báo | `foc_threshold` (d) chỉ OWN | Có |

Hai chỗ số đếm có thể **nhỏ hơn** số dòng của danh sách mà sổ tay chưa nói (thẻ 110-04, Suggestion):
- Số đếm chỉ tính lần sửa có vai lúc sửa là FD/FDL (`before.actorRole`). Bản ghi trước v1.0.5 không có khóa này (ARC B1F-02). Vì vậy tháng lên v1.0.5, danh sách của một người có thể có thêm các lần sửa trước ngày lên bản mà không vào số cảnh báo.
- Phụ thu trả muộn Desk tính lại khi đổi giờ (đặt lại giờ trả muộn B15, hay Trả phòng với giờ sớm hơn) **không** phải lần sửa giảm và không có trong bộ lọc. Kiểm soát chỗ này là BR-414: giờ khai sớm hơn lúc bấm quá 30 phút thì phải ghi chú (DOM 15.1).

Kết luận: số đếm khớp sổ tay. Sổ tay `main` vẫn ghi "(khi Desk có dòng này)" cho dòng **Cần chú ý**. Từ #110, máy chủ đã sinh dòng này. BA bỏ cụm đó khi Desk V5-16 có câu cho `check = line_reduction_count`, như BA đã ghi trong chú thích.

### 1.4 Câu "lần đếm lại minibar thấp hơn có trong bộ lọc 7 ngày từ v1.0.5" – có phải viết có điều kiện không

**Có điều kiện, và điều kiện là #133, không phải #110.**

- #110 không sửa `inventory/internal/minibar.service.ts`. Trên #110 một mình, lần đếm lại thấp hơn vẫn chỉ đảo dòng cũ và ghi dòng mới (`folio.line_reversed`). Không có `folio_line.adjusted` nên không vào `reductionsOnly`, cũng không vào `line_reduction_count`.
- #133 (`r5-v516-minibar` @ `0636f2fc`, draft, xếp trên #110 @ `e870a1c9`) mới ghi `folio_line.adjusted` (`before.category minibar`, vai lúc đếm, 4 khóa dòng gốc, `reason: minibar_recount`). #133 cần #110, còn #110 thì không kéo theo #133.
- Hai chỗ đang gắn điều kiện sai:
  - chú thích nguồn trong sổ tay (mục 8.1): "vào v1.0.5 nếu #110 gộp trước", "#110 trượt khỏi tag thì trả lại câu … (`d467578b`)";
  - plan 4a dòng T5 gọi phần audit là commit `0b2ebb45`, không nêu số PR và SHA đã duyệt.

Chữ khách thấy (chủ đầu tư đọc) **không cần** thêm "nếu", với hai điều kiện:
1. T5 vẫn là dòng **chặn**: thiếu phần audit thì không cắt tag (SEC V516-01);
2. lối lùi `d467578b` được kích bằng "thiếu #133".

Lý do phải sửa ngay:
- Ở v1.0.5, phần chặn đếm lại không lên (R5-B-15).
- Vì vậy bộ lọc 7 ngày là kiểm soát **duy nhất** cho đường thất thoát minibar, khoản thu tiền mặt nhiều nhất ở OTTIMO.
- Người cắt tag chỉ kiểm #110 sẽ tưởng câu sổ tay đúng, trong khi lần đếm lại không hiện. Xem thẻ 110-02.

### 1.5 Thẻ cũ

- 110-01 (dòng hư hỏng ngoài bảng đã được quản lý duyệt giá): vẫn Open, v1.0.6. #110 không đổi chỗ này.
- QA-BR438-01: đã sửa trong oracle v0.5.14–v0.5.16. Test #110 dựng ca theo `minibar_check`, B15 đổi tên BR-438-07, BR-438-04 theo phương án A. DOM đồng ý đóng.
- Ca minibar dùng món giả 35.000, định mức 3: đúng ví dụ BR-438.

---

## 2. PR #131 @ `0594d165`

### 2.1 Mốc "đạt" – đúng 4.2 ý 4, 15.5, BR-525 (iii), (d)

- `tryEarnCommissions` nhận thêm `stay` và gọi `ensureCommission` **trước** khi xét "đạt", ở cả ba mốc:
  - B18 (`checkout.service.ts`, `StayPort.confirmedStay`);
  - thu tiền, đối soát sau trả phòng (`payments.service.ts` `tryEarn`; chỉ nạp `stay` khi đơn `checked_out`);
  - xóa nợ (`foc.service.ts` `afterWriteOff`).
- Sau đó điều kiện "đạt" giữ nguyên:
  - còn phải thu = 0;
  - khoản chuyển khoản ghi **sau** `folio.settled_at` phải đã đối soát (thẻ PR99-01: VietQR thu lúc trả phòng không giữ hoa hồng);
  - khoản do chính người hưởng ghi phải đã đối soát, bất kể lúc nào (BR-527).
- Đơn chốt lúc thiếu tỷ lệ mà không ai sửa gì nay có bản ghi ở B18 (T-14-1). Nếu còn nợ ở B18, bản ghi được tạo `projected` ngay, rồi "đạt" khi thu xong hoặc xóa nợ (H1-03 (4)). Đó chính là ý (1) của thẻ 101-01.
- Xóa nợ trên dòng tiền phòng của đơn chưa có bản ghi:
  - `afterWriteOff` chỉnh cơ sở các bản ghi đang có trước, rồi mới gọi `ensureCommission`. Lúc đó đơn chưa có bản ghi, nên không trừ hai lần.
  - Bản ghi mới tính trên `room_revenue_vnd` (đã trừ dòng FOC `debt_write_off` qua `discount_vnd`), tức đúng "tiền phòng − phần xóa nợ trên dòng tiền phòng" của BR-525 R7LOCK-02 (4).
  - Test H1-03 (1) chỉ xóa nợ trên dòng F&B (cơ sở không đổi). Nên thêm ca dòng tiền phòng (thẻ 131-03 ý 3).
- Đơn hủy/không đến mà OTTIMO giữ tiền (BR-903 (2), (4); ESC-051 câu 1 A): `tryEarnCommissions` chỉ chạy cho `checked_out`, nên vẫn chưa có hoa hồng. Ngoài phạm vi #131. Cách làm tạm đã có ở thẻ FB-R5-DOM-OPS-129-02: chủ đầu tư tính tay trên số giữ lại.

### 2.2 Ghim tỷ lệ – đúng BR-903 (5), 14.2

Thứ tự đọc tỷ lệ của `syncCommission`:
1. ảnh chụp của đơn (báo giá);
2. tỷ lệ của bản ghi `commission` đầu tiên của đơn, cùng `payee_type`, mọi trạng thái;
3. bảng hiệu lực ngày đồng bộ.

DOM đồng ý ghim ở bản ghi thay vì ghi ngược vào `pricing_snapshot`. Về nghiệp vụ hai cách như nhau: mỗi đơn một tỷ lệ, đổi bảng không tính lại đơn đã có bản ghi. Điều kiện: mọi nơi đọc "tỷ lệ của đơn" phải theo cùng thứ tự (thẻ 131-02).

T-14-2 đúng như DOM viết:
- bản ghi đầu `test_rate_short`;
- OWN đổi bảng sang `test_rate_short_2`, báo giá mới đọc `test_rate_short_2`;
- gia hạn 1 đêm → bản ghi cũ `void`, bản ghi mới vẫn `test_rate_short`, cơ sở theo số đêm mới;
- trả phòng → `earned`.

Trả lời hai câu BE-H hỏi DOM:
- **Đơn tạo thẳng, không qua báo giá, nay giữ tỷ lệ của bản ghi đầu:** đồng ý. Đây là BR-903 (5) cho đơn không có ảnh chụp.
- **Tỷ lệ 0 không tạo bản ghi nên không ghim (ARC chấp nhận):** chấp nhận cho v1.0.5. Bảng nội bộ có một mức cho mọi người hưởng, nên ca này hiếm. Luật đích ở thẻ 131-02.

### 2.3 Hủy hoặc hoàn sau khi đã "đạt"

| Ca | Mã @ `0594d165` | Luật | Đánh giá |
|---|---|---|---|
| Hủy đơn (B10/B11, đổi cơ sở) sau B18 | không xảy ra: đơn `checked_out` không hủy được. `voidCommissions` chỉ chạy khi hủy đơn | – | Đúng |
| `ensureCommission` chạy lại trên đơn đã `earned` | bỏ qua vì có bản ghi không `void` (test "never adds a second row") | không chi hai lần | Đúng |
| Đảo khoản thu sau B18 làm còn nợ | `unearnCommissions`: `earned`/`payable` → `projected`; khi thu xong thì `ensureCommission` thấy bản ghi `projected` và bỏ qua, rồi bản ghi đó "đạt" lại | BR-525 (iii) | Đúng |
| Xóa nợ trên dòng tiền phòng sau khi đạt | `afterWriteOff` trừ cơ sở cả bản ghi `earned`, `payable` | BR-525 R7LOCK-02 (4) | Đúng |
| Quản lý giảm dòng tiền phòng trên folio đã chốt (A32, hoàn cho khách) sau khi đạt | không đụng `commission`: bản ghi `earned` giữ cơ sở cũ | BR-903 (1) cơ sở sau giảm; BR-212 "điều chỉnh sau khi đã chi trừ vào kỳ sau" | **Lệch, có từ trước #131** – thẻ 131-03 |
| Bản ghi `paid` khi khách được hoàn hoặc xóa nợ | không tự trừ | BR-525 (iii): PO chốt ở R3, chưa chốt | Giữ; chủ đầu tư chỉnh ở kỳ chi |

### 2.4 Khóa tỷ lệ chỉ OWN/MGR; luật lưu

- `listParameters`, `getParameterHistory`: FDL không thấy tên khóa ở `data` hay `missing`, đọc lịch sử nhận 404.
  - Khớp 4.4: chủ đầu tư xem và sửa, quản lý xem không sửa (quản lý đã thấy cơ sở và số hoa hồng từng đơn qua A60, nên thấy tỷ lệ không lộ thêm gì), vai khác không.
  - `manager_performance_bonus_pct` cho quản lý thấy: khớp 7.3 (quản lý thấy tỷ lệ, cơ sở, số thưởng của mình).
- `commissionTableIssue`: đúng hai khóa `staff`, `collaborator`; mỗi khóa 0–100, tối đa 2 chữ số thập phân; sai → 422 `PARAM_OUT_OF_RANGE`. Khớp 4.1.
  - Không bắt hai khóa bằng nhau là đúng: "nhập cùng một số" là cách điền theo bảng hiện nay, không phải luật của phần mềm.

---

## 3. Thẻ feedback

### FB-R5-DOM-BE-110-02
- Mức độ: **Minor** (sửa trước khi cắt tag v1.0.5; không chặn gộp #110)
- Người sửa: BA (chú thích sổ tay), PO + ORC (plan 4a dòng T5)
- Vị trí: `product/docs/manual/guides/01-chu-dau-tu-quan-ly.md` dòng đầu tệp ("lần đếm lại minibar thấp hơn có trong bộ lọc 7 ngày từ v1.0.5"), mục 8.1 gạch đầu và chú thích nguồn ("vào v1.0.5 nếu #110 gộp trước", "#110 trượt khỏi tag thì trả lại câu … `d467578b`"); dòng "Mỗi tuần" mục 2.1; `rounds/round-05/plan.md` mục 4a dòng T5 (`0b2ebb45`)
- Vấn đề: câu chỉ đúng khi **#133** có trong tag. #110 không ghi `folio_line.adjusted` cho lần đếm lại minibar (không sửa `minibar.service.ts`). Chỉ #133 @ `0636f2fc` (draft, xếp trên #110) ghi bản ghi đó. Chú thích sổ tay lấy #110 làm điều kiện. T5 nêu commit `0b2ebb45`, không nêu PR #133.
- Vì sao quan trọng: ở v1.0.5 phần chặn đếm lại chưa lên, nên bộ lọc 7 ngày là kiểm soát duy nhất cho minibar, khoản thu tiền mặt nhiều nhất. Nếu tag có #110 mà thiếu #133, chủ đầu tư rà bộ lọc mỗi tuần mà không thấy lần đếm lại nào, và tưởng không có.
- Đề xuất sửa:
  1. BA: chú thích nguồn đổi điều kiện thành "#133 (BE-A2 `r5-v516-minibar`, xếp trên #110) có trong tag". Lối lùi `d467578b` kích khi thiếu #133. Không đổi chữ chủ đầu tư đọc.
  2. PO + ORC: T5 ghi "PR #133 @ <SHA đã duyệt>" thay cho riêng `0b2ebb45`. Thêm một lệnh kiểm lúc cắt: `git merge-base --is-ancestor <SHA #133> <tag>`.
  3. Nếu SEC, ORC cho cắt thiếu #133 (ngoại lệ đã ghi ở T5): BA trả câu `d467578b` ở cả mục 8.1, dòng đầu tệp và dòng "Mỗi tuần".
- Trạng thái: Open

### FB-R5-DOM-BE-110-03
- Mức độ: Suggestion
- Người sửa: BE-H
- Vị trí: `test/integration/v5-16-br438-checkout.test.ts`, lần chạy 3 của `carryToCheckout`
- Vấn đề: lần 3 để lại dòng trả muộn B15 mã `manual` trên folio `settled`. Đây là dòng duy nhất mà `source` giống dòng nhập tay, nằm trên folio đã chốt. Oracle ghi chú: lễ tân bỏ dòng này thì theo A32 như BR-438-04. Chưa có test nào kiểm.
- Vì sao quan trọng: nếu sau này ai đó đổi thứ tự kiểm (BR-438 trước A32), lễ tân sẽ nhận gợi ý "Gửi miễn có duyệt" trên folio đã chốt, mà FOC trên folio đã chốt thì không gửi được.
- Đề xuất sửa: cuối lần 3, Hạnh bỏ dòng B15 → 403 `FORBIDDEN_ACTION`, thân không có `requiredFlow`, không thêm `access.denied` lý do `BR-438`, folio không đổi.
- Trạng thái: Open

### FB-R5-DOM-BE-110-04
- Mức độ: Suggestion
- Người sửa: BA
- Vị trí: `01-chu-dau-tu-quan-ly.md` mục 8.1, khối **Từ v1.0.5 – bộ lọc Sửa giảm dòng – 7 ngày**
- Vấn đề: sổ tay chưa nói hai chỗ ở mục 1.3:
  - (a) tháng lên v1.0.5, danh sách mở từ **Cần chú ý** có thể nhiều hơn số cảnh báo, vì lần sửa trước ngày lên bản không có vai lúc sửa nên không được đếm;
  - (b) phụ thu trả muộn Desk tính lại khi đổi giờ không có trong bộ lọc.
- Vì sao quan trọng: chủ đầu tư so số cảnh báo với số dòng và hỏi đội vì sao lệch.
- Đề xuất sửa: thêm vào gạch "Mở từ dòng Cần chú ý": "Tháng lên v1.0.5: lần sửa trước ngày lên bản có trong danh sách nhưng không tính vào số cảnh báo." Thêm vào gạch "Không gồm tiền đêm": "Không gồm phụ thu trả muộn Desk tính lại khi đổi giờ trả; giờ trả khai sớm hơn lúc bấm quá 30 phút có ghi chú ở sổ giao ca."
- Trạng thái: Open

### FB-R5-DOM-BE-131-01
- Mức độ: **Major** (có từ trước #131, không chặn gộp #131; xong trước kỳ chốt 01/12, cùng hạn PR-M)
- Người sửa: BE-H (ARC chọn chỗ đặt; SEC xem phần quyền)
- Vị trí:
  - `reservations/internal/reservations.service.ts`, PATCH đơn: đổi `closerUserId` chỉ ghi `reservation.closer_changed` và `reservation_change`. `money.resynced` chỉ chạy khi `repriced` (= đổi số người hoặc OTA đặt lại). MGR+ đổi được người chốt ở `confirmed` và `in_house`;
  - `folio.service.ts` `ensureCommission` (bỏ qua khi có bản ghi không `void`).
- Vấn đề (DOM đọc mã; BE-H xác nhận bằng test):
  - (a) **Đổi người chốt không chuyển hoa hồng.** Ví dụ:
    - đơn sale căn 202, 2 đêm × 700.000, người chốt sale A; khi xác nhận đã có bản ghi `projected` của A theo `test_rate_short`, cơ sở 1.400.000;
    - trước ngày đến, quản lý sửa người chốt thành sale B (ghi nhầm lúc tạo đơn);
    - không có đồng bộ hoa hồng. Ở B18, `ensureCommission` thấy bản ghi của A nên bỏ qua; `tryEarnCommissions` chuyển bản ghi của **A** sang `earned`;
    - đúng luật: A `void` (lý do đổi người chốt), B `earned` = `test_rate_short` × 1.400.000.
  - (b) **BR-903 (3):** người chốt ghi hoặc đổi **sau lúc nhận phòng** thì đơn không có hoa hồng; chỉ chủ đầu tư sửa nhầm được, có lý do, có audit. Mã cho MGR đổi ở `in_house`, và hoa hồng vẫn có: người cũ, nếu đã có bản ghi; người mới, nếu đơn chưa có bản ghi, vì từ #131 B18 tạo bản ghi cho người chốt đang ghi trên đơn.
- Vì sao quan trọng:
  - tiền hoa hồng chi sai người, không ai thấy;
  - màn Hoa hồng ghi A trong khi đơn ghi B;
  - ca (b) là đường để quản lý gán hoa hồng cho người quen trên lượt đang ở.
- Đề xuất sửa:
  1. Đổi người chốt **trước** nhận phòng (MGR+ như EP02 5.4): đồng bộ hoa hồng trong cùng giao dịch. Bản ghi người cũ `void` (lý do `closer_changed`). Bản ghi người mới theo tỷ lệ ghim của #131, nên đổi người không đổi tỷ lệ.
     - ARC có thể chọn cách khác: ở mốc "đạt", khi bản ghi sống chỉ là `projected`, chạy `syncCommission` đầy đủ thay vì bỏ qua; chỉ bỏ qua khi đã có `earned`/`payable`/`paid`. Tính chất "chạy lại không thêm bản ghi thứ hai" vẫn giữ.
  2. Đổi **sau** nhận phòng:
     - chỉ OWN, lý do bắt buộc; MGR, FD nhận 403 `FORBIDDEN_ACTION`;
     - hoa hồng theo người OWN sửa;
     - mốc "nhận phòng" lấy từ `checked_in_at` của đơn, so với lúc ghi `reservation.closer_changed`. Không cần migration.
  3. Test:
     - T-30-3;
     - ca (a): đổi trước ngày đến → B `earned`, A `void`;
     - MGR đổi ở `in_house` → 403;
     - OWN sửa ở `in_house`, có lý do → người mới `earned`;
     - đơn `rate_missing` đổi người chốt sau nhận phòng (không phải OWN) → B18 không tạo bản ghi cho người mới.
  4. Tới khi sửa (BA, sổ tay quản lý): "Sửa người chốt: sau khi lưu, mở **Hoa hồng** kiểm người hưởng của đơn. Sai thì báo chủ đầu tư chỉnh khi chi." PO thêm dòng **Giới hạn đã biết** nếu chưa sửa kịp v1.0.5.
- Trạng thái: Open

### FB-R5-DOM-BE-131-02
- Mức độ: Minor (v1.0.6; PR-M áp cùng thứ tự cho HĐ)
- Người sửa: BE-H, ARC; PR-M (mục "Cần chú ý" `commission_rate_missing`); DATA
- Vị trí: `folio.service.ts` `syncCommission` (thứ tự đọc tỷ lệ), `ensureCommission`; hợp đồng 0.3.13 mục 1.22 (`commission_rate_missing`)
- Vấn đề:
  - (a) Đơn tạo thẳng không có ảnh chụp. Nếu tỷ lệ hiệu lực lúc tạo đơn là 0 (chủ đầu tư đã lưu 0), đơn không có bản ghi nên không ghim. Chủ đầu tư nâng tỷ lệ trước ngày trả phòng → từ #131, B18 tạo bản ghi theo tỷ lệ mới. Ví dụ: tạo đơn 05/12 lúc `staff` = 0; 10/12 chủ đầu tư lưu `test_rate_short`; trả phòng 12/12 → bản ghi `test_rate_short` × cơ sở. Đúng BR-006, BR-903 (5): 0 đ.
  - (b) "Tỷ lệ của đơn" nay nằm ở ba chỗ (ảnh chụp, bản ghi đầu, bảng). Nơi khác chỉ đọc ảnh chụp sẽ sai, ví dụ "Cần chú ý" `commission_rate_missing` của PR-M: mọi đơn tạo thẳng có người chốt đều bị đếm là "chưa có tỷ lệ", dù đã có bản ghi.
- Vì sao quan trọng: (a) chi hoa hồng cho đơn chốt lúc chủ đầu tư quyết 0; (b) chủ đầu tư thấy báo động giả, rồi bỏ qua báo động thật.
- Đề xuất sửa: một thứ tự đọc cho mọi nơi (đồng bộ, mốc "đạt", "Cần chú ý", Desk, DATA):
  1. ảnh chụp của đơn, kể cả 0;
  2. tỷ lệ của bản ghi đầu cùng `payee_type`;
  3. tỷ lệ hiệu lực **ngày tạo đơn** (BR-903 (5)), kể cả 0;
  4. chỉ khi ngày đó chưa có tỷ lệ (`rate_missing`): tỷ lệ hiệu lực ngày đồng bộ (T-14-1 giữ nguyên).

  `commission_rate_missing` = đơn có người hưởng mà cả bốn bước không ra số. Câu release notes "Tỷ lệ 0 anh/chị đã lưu thì Desk ghi 0 đ" giữ được ở v1.0.5: ca (a) cần chủ đầu tư lưu 0 rồi nâng lên, bảng nội bộ hiện không có.
- Trạng thái: Open

### FB-R5-DOM-BE-131-03
- Mức độ: Minor (v1.0.6)
- Người sửa: BE-H, ARC; QA thêm ca
- Vị trí: `folio-lines.service.ts` `adjust` trên folio `settled` (A32) và hoàn tự sinh: không gọi gì của `commission`. So với `foc.service.ts` `afterWriteOff` (chỉnh cơ sở khi xóa nợ trên dòng tiền phòng).
- Vấn đề (DOM đọc mã; BE-H xác nhận): đơn sale 2 đêm × 700.000, B18 thu đủ → `earned`, cơ sở 1.400.000. Hôm sau khách phàn nàn, quản lý hạ một đêm còn 350.000 trên folio đã chốt (A32), hoàn 350.000. Bản ghi vẫn `earned` trên 1.400.000. BR-903 (1): cơ sở sau giảm là 1.050.000. BR-212: điều chỉnh sau khi **đã chi** thì trừ vào kỳ sau, nghĩa là chưa chi thì chỉnh ngay.
- Vì sao quan trọng: chi hoa hồng trên tiền đã hoàn cho khách. Ca hiếm ở 10 căn, có từ trước #131.
- Đề xuất sửa:
  1. A32 làm giảm tiền phòng hay phụ thu người của đơn có người hưởng:
     - bản ghi `projected`/`earned`/`payable`: chỉnh cơ sở và số như `afterWriteOff`, có audit `commission.projected` lý do "giảm sau trả phòng";
     - `paid`: không sửa, chủ đầu tư trừ kỳ sau (chờ PO chốt BR-525 (iii)).
  2. Tới đó (BA, sổ tay chủ đầu tư mục chi hoa hồng): "Đơn có hoàn tiền phòng sau trả phòng: trừ phần hoa hồng trên số hoàn khi chi."
  3. QA: thêm ca xóa nợ trên **dòng tiền phòng** cho đơn chốt lúc thiếu tỷ lệ (#131). Mong đợi: cơ sở = tiền phòng − số xóa nợ, như ví dụ BR-525 (4) với `test_rate_short`.
- Trạng thái: Open

### FB-R5-DOM-BE-131-04
- Mức độ: Minor (v1.0.6)
- Người sửa: BE-H; SEC xác nhận (luật gốc SEC-BE-26); BA câu sổ tay tạm
- Vị trí: `folio.service.ts` `syncCommission`: loại người hưởng lấy từ vai **đang có** và tài khoản `active` (`upr.revoked_at IS NULL AND u.status = 'active'`)
- Vấn đề: ví dụ:
  - CTV X chốt đơn 3 đêm, đã có bản ghi `projected`;
  - X hết hợp tác, chủ đầu tư **Khóa tài khoản**;
  - hai hôm sau khách gia hạn 1 đêm (B13) → đồng bộ không thấy vai của X → bản ghi `void` (lý do `resync`), không có bản ghi mới → X mất hoa hồng cả 4 đêm.

  Đơn thiếu tỷ lệ của X thì từ #131 cũng không có bản ghi ở B18. Sổ tay `01` mục 1.9 lại ghi: "Khóa tài khoản không xóa hoa hồng còn nợ của các đơn CTV đó đã chốt".

  Tạm khóa do sai mật khẩu (`locked`) cũng rơi vào ca này, nhưng thường tự lành nhờ #131: lần "đạt" sau khi mở khóa tạo lại bản ghi theo tỷ lệ ghim.
- Vì sao quan trọng: sổ tay hứa một điều mà mã không giữ; CTV không còn đăng nhập để tự thấy.
- Đề xuất sửa:
  - kiểm `active` và vai còn hiệu lực **chỉ lúc chọn hay đổi người chốt** (SEC-BE-26, giữ nguyên);
  - lúc đồng bộ và lúc "đạt", loại người hưởng lấy theo vai của người chốt lúc ghi lên đơn, kể cả vai đã thu hồi, không xét trạng thái tài khoản;
  - chủ đầu tư muốn bỏ hoa hồng của người nghỉ thì sửa có lý do (như BR-903 (3)).
  - Tới đó (BA, `01` 1.9): "Trước khi khóa tài khoản sale/CTV: mở **Hoa hồng**, ghi lại các đơn còn Dự kiến của người đó. Đơn nào sau đó gia hạn, rút ngắn, đổi căn hay đổi số người: chi hoa hồng đơn đó theo bảng nội bộ, ngoài Desk."
- Trạng thái: Open

---

## 4. Điểm làm tốt

- #110 gom "thế nào là sửa giảm" vào một cổng (`lineReductionWhere`) cho cả danh sách lẫn số cảnh báo. Chủ đầu tư bấm từ cảnh báo sang danh sách sẽ thấy đúng các lần đã đếm.
- Tệp `v5-16-br438-checkout.test.ts` kiểm cả các khóa "không có" của oracle: thân 403 không có `requiredFlow`, không có `access.denied` lý do BR-438, MGR không tự duyệt hoàn. Đây là những chỗ dễ sai lặng nhất.
- #131 giữ một luật "đã có hoa hồng thì không tạo thêm" cho mọi mốc, và ghim tỷ lệ mà không đụng ảnh chụp giá của đơn. BE-H tự nêu hai câu nghiệp vụ còn hở (đơn tạo thẳng, tỷ lệ 0) thay vì im lặng chọn.

## 5. Giả định DOM dùng

1. Đọc mã ở `e870a1c9`, `0594d165`, `0636f2fc` bằng `git show`/`git diff`, không chạy test.
2. "Đổi người chốt không đồng bộ hoa hồng" (131-01) và "A32 không chỉnh hoa hồng" (131-03) là DOM đọc từ các chỗ gọi `money.resynced`, `syncCommission`. BE-H xác nhận bằng test khi sửa.
3. BR-903 (3) "chỉ chủ đầu tư sửa nhầm người chốt sau nhận phòng" là luật đã có (v0.5.12), không phải chính sách mới. Câu sổ tay `01` 1.9 về khóa tài khoản đã có. Vì vậy không ESC.
4. Bảng nội bộ 01/11 có một mức cho mọi người hưởng (BR-903), nên ca tỷ lệ 0 ở 131-02 hiện không xảy ra ở OTTIMO.
5. #133 vẫn draft @ `0636f2fc`, DOM không review #133 ở đây. Mục 1.4 chỉ dựa trên việc #133 là PR duy nhất sửa `minibar.service.ts`.

## 6. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review BE-H #110 @ e870a1c9 và #131 @ 0594d165**: #110 DUYỆT – BR-438-04 (FD/FDL 403 không requiredFlow, không access.denied BR-438, folio không đổi; MGR 201, một folio_settled_reduction vai manager, hoàn tự sinh "Tự sinh từ A32" MGR không tự duyệt) và 3 lần carryToCheckout khớp oracle v0.5.16; bộ lọc "Sửa giảm dòng – 7 ngày" và số Cần chú ý line_reduction_count khớp sổ tay BA da596507; câu "lần đếm lại minibar thấp hơn có trong bộ lọc 7 ngày từ v1.0.5" chỉ đúng khi #133 cùng tag (#110 không ghi audit cho lần đếm lại) – chú thích sổ tay và plan 4a T5 phải lấy #133 làm điều kiện, chữ chủ đầu tư đọc giữ nguyên vì T5 chặn (110-02 Minor); 110-03, 110-04 Suggestion. #131 DUYỆT – bản ghi hoa hồng chậm nhất ở mốc "đạt" (B18, thu nợ/đối soát, xóa nợ; tiền sau trả phòng tính từ folio.settled_at), tỷ lệ ghim theo ảnh chụp → bản ghi đầu cùng loại người hưởng → bảng ngày đồng bộ, chạy lại không thêm bản ghi, khóa tỷ lệ chỉ OWN/MGR, luật lưu 0–100 tối đa 2 số lẻ; 101-01 đạt ý (1)(2), ý (3) chấp nhận chưa làm, đóng khi #131 gộp. 131-01 Major (không chặn gộp, trước kỳ chốt 01/12): đổi người chốt không chuyển hoa hồng, đổi sau nhận phòng chỉ OWN (BR-903 (3)); 131-02/03/04 Minor v1.0.6: một thứ tự đọc tỷ lệ cho mọi nơi (kể cả tỷ lệ 0 ngày tạo đơn), A32 giảm tiền phòng sau khi đạt phải chỉnh cơ sở, khóa tài khoản người chốt không làm mất hoa hồng. Không ESC, không số hoa hồng | DOM | rounds/round-05/reviews/DOM-on-be-h-prs-110-131.md |`
