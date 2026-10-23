# ARC review BE-B – Round 3 Sprint 1, lượt kiểm tiền bước 1–2 (210 + 209) và kiến trúc 208

- Người review: ARC | Round 3 – Sprint 1, bước Review (bắt buộc cho PR tiền) | Ngày: 23/10/2026
- Đối tượng chính: commit `61dfdd5` (BUG-R2-210 + BUG-R2-209, `CheckoutService.writeDebt`) trên nhánh `worktree-agent-a4a7a7b47e3d900bf`. Xem thêm ở mức kiến trúc: `ad7390c` (BUG-R2-208 phần `folio-lines`). Báo cáo tác giả: `rounds/round-03/outputs/BE/s1-be-b.md`.
- Đối chiếu: `rounds/round-03/outputs/ARC/s1-contracts.md` mục 5; `rounds/round-02/outputs/ARC/openapi-0.3.7.md` 16.31; DOM `rounds/round-03/outputs/DOM/s1-money-oracle.md` mục 1–4, 8.

## Kết luận

**`61dfdd5` gộp được.** Không có thẻ Blocker hoặc Major. Có 4 thẻ Minor và 3 Suggestion, sửa trong commit tiếp theo của BE-B, trước khi QA xác nhận gỡ `pendingFix`. Các thẻ này không chặn gộp.

**`ad7390c`**: đúng kiến trúc 16.31.1 và N-15. Điều kiện gộp giữ nguyên như BE-B ghi: chỉ gộp sau khi `61dfdd5` đã gộp và xanh, và SEC đã review trên head SHA sẽ gộp. Lý do phải đi sau: đường đọc `openDebtVnd` của nợ cũ (giả định 1 bên dưới) nằm trong `61dfdd5`.

## Đã kiểm (ARC tự chạy, worktree tách riêng ở `61dfdd5`, PostgreSQL 17 riêng, vai `ottimo_app` / `ottimo_migrator`)

| Kiểm tra | Kết quả |
|---|---|
| `tsc --noEmit` (api) | đạt |
| `eslint` các tệp sửa | đạt |
| `r3-debt-210-209` + `s4-recheck6-be-a` + `reversal-debt-g4` | 49/49 |
| Toàn bộ api `vitest run` | **105 tệp đạt, 1 bỏ qua; 2.980 đạt, 2 bỏ qua**, khớp báo cáo BE-B |
| `module-boundaries`, `contract` | 13/13 |
| Probe ARC (không commit): nợ cũ 100.000, A32 +10.000 hai lần nối nhau trên dòng trước trả phòng, khoản cửa sổ 70.000 rồi A32 +5.000 trên chính dòng đó | O giữ **100.000** (W = 20.000 + 75.000). Đảo 834.000 → O **934.000**. J15 → O = B = **1.029.000**. Chuỗi đệ quy của `windowChargesVnd` đúng |
| Probe ARC: nợ cũ, A32 giảm dòng trước trả phòng (mã R2 N-7) | 409, O giữ 100.000 |

Đối chiếu từng ca oracle DOM 210-A…C, 209-A…E: test của BE-B kiểm đúng số, hạn, nhật ký và thông báo. Cách ánh xạ giờ (trả phòng 11:00 thay 10:00, hạn D+3/D+4/D+5) chấp nhận được, vì thứ được kiểm là quan hệ giữa các hạn.

Rà logic `writeDebt` theo 16.31.2 (b):
- X đọc dưới L1 → L3 của người gọi (`lockDebtRows` lấy lại khóa không chờ).
- `debtReductionsVnd` vẫn đếm khoản thu đã bị đảo (`status IN ('succeeded','reversed')`). Vì vậy một lần đảo không làm D tụt, X không bị thổi phồng. Đã thử tay ca "đảo lần hai trên chu kỳ có W": O = 934.000, W = 70.000, đúng.
- Nhánh nối: `recorded += phần ghi`, giữ `opened_at`, `base`, hạn, lý do. Nhánh mở: hạn mới, `base` = Σ giảm hiện tại. Nhánh nợ cũ: `recorded = X + phần ghi`, giữ hạn cũ. Cả ba khớp 5.2.

---

## Thẻ feedback

### FB-R3-ARC-BEB-S1-01
- Mức độ: Minor
- Vị trí: `services/api/test/integration/s438-r8/r3-debt-210-209.test.ts`; `checkout.service.ts` `windowChargesVnd` (CTE đệ quy `chain`)
- Vấn đề: phần "tăng A32 sau trả phòng" của W_cũ (s1-contracts 5.2) dò ngược bằng một CTE đệ quy theo `related_line_id`. Đây là SQL mới phức tạp nhất của commit, nằm trên đường tiền, nhưng không ca test nào đi qua nó. Mọi ca 210 chỉ có khoản cửa sổ là dòng `post_checkout` thường. ARC đã chạy probe (xem bảng trên) và kết quả đúng, nhưng probe không nằm trong bộ test.
- Vì sao quan trọng: nếu ai đó sửa cách A32 tạo dòng thay (`relatedLineId`, `postCheckout`, cùng `category`), W_cũ sai mà CI vẫn xanh. Khi đó O của nợ cũ lệch, kéo theo trần xóa nợ và giới hạn giảm của 208.
- Đề xuất sửa: thêm vào `r3-debt-210-209.test.ts` hai ca: (a) "210-A32": A32 tăng nối nhau trên dòng trước trả phòng, cộng A32 trên một khoản cửa sổ (số như probe); (b) một chuỗi A32 dài 3 dòng, để kiểm điều kiện dừng `c.post_checkout`. Bản probe đã chạy đạt nằm ở `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/arc-probe-210-a32.test.ts`, chép được.
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-02
- Mức độ: Minor
- Vị trí: `test/integration/s438-r8/fixture.ts` `j15Unit` (`hasOpenDebt: … !== null`) so với `folio/public/folio-close-job.ts` (`openDebtVnd > 0`)
- Vấn đề: `61dfdd5` đổi `hasOpenDebt` của J15 thật sang "theo số", nhưng fixture mà mọi ca 209 dùng vẫn giữ định nghĩa cũ (`openDebt !== null`). Như vậy lưới an toàn "J15 không ghi được nợ mà cũng không có nợ mở → throw" của bản chạy thật không được test nào đi qua.
- Vì sao quan trọng: đây đúng là lớp lỗi "hai định nghĩa song song" của lượt 8. Hiện hai định nghĩa cho cùng kết quả trong mọi trạng thái với được. Nhưng khi 208 phần còn lại cho `openDebt` trả `null` khi O = 0, chúng sẽ tách nhau mà test không thấy.
- Đề xuất sửa: cho `j15Unit` dùng chung hàm `hasOpenDebt` với `folio-close-job.ts` (xuất một hàm nhỏ, hoặc gọi đúng biểu thức `openDebtVnd > 0`). Ít nhất một ca 209 (209-E) chạy qua `runJ15` (JobRunner thật).
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-03
- Mức độ: Minor
- Vị trí: `checkout.service.ts` `writeDebt`, audit `reservation.debt_on_checkout` `after.openDebtVnd = openBeforeVnd + debtVnd`
- Vấn đề: số "công nợ sau" trong nhật ký tiền được **tính**, không **đọc lại** sau khi ghi. Nó chỉ bằng `cycleOpenDebtVnd` thật khi R − D ≤ B trước lần ghi (không bị kẹp). Với trạng thái có kẹp (R − D > B, như BE-B tự nêu ở giả định 4 của báo cáo), hai số khác nhau. Khi đó nhật ký nói một số, còn hàm đọc ra số khác.
- Vì sao quan trọng: critic và fuzz R3-Q30 dùng nhật ký này để đối chiếu I3/I5. Một số tự tính trong nhật ký tiền có thể che lệch thay vì làm lộ lệch.
- Đề xuất sửa: sau `UPDATE`, gọi lại `cycleOpenDebtVnd(tx, folioId, primaryAfter, balanceAfter)` rồi ghi số đó vào `after.openDebtVnd`. Chi phí là thêm 1–2 truy vấn trên đường hiếm (G-4, J15).
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-04
- Mức độ: Minor
- Vị trí: `checkout.service.ts` `openDebt` (vẫn `primary.debt_settled_at !== null → null`) so với `cycleOpenDebtVnd` (không đọc `debt_settled_at`)
- Vấn đề: sau `61dfdd5`, cổng `openDebt` (trần xóa nợ, nhánh thu nợ, N-7/208) vẫn coi chu kỳ "đã settled" là không nợ. Trong khi đó `writeDebt`/J15 đọc theo số. Trong mọi trạng thái với được, hai cách cho cùng kết quả (chứng minh ở câu trả lời giả định 4). BE-B đã ghi việc này ở "phần còn lại của 208".
- Vì sao quan trọng: nguyên tắc 16.31 là "không đọc `debt_settled_at` ở bất kỳ quyết định nào". Nếu để kéo dài, đây sẽ là định nghĩa thứ hai.
- Đề xuất sửa: làm cùng phần còn lại của 208 (`openDebt` → `null` khi `openDebtVnd` = 0, bỏ điều kiện `debt_settled_at`), không để sang Sprint 2. QA thêm bất biến fuzz: "`debt_settled_at` NOT NULL ⇒ `cycleOpenDebtVnd` = 0" (xem câu trả lời 4).
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-05
- Mức độ: Suggestion
- Vị trí: `checkout.service.ts` `cycleOpenDebtVnd`
- Vấn đề: lần kẹp `min(open, owed)` che mọi trạng thái R − D > B. Hiện trạng thái này không với tới được, nhưng nếu một đường tiền mới (thu hồi FOC Sprint 2, cổng thanh toán R3) làm nó xuất hiện thì không ai biết.
- Đề xuất sửa: khi `open > owed` (kẹp có tác dụng), ghi log cảnh báo có cấu trúc (`debt.clamped`, folioId, chỉ số tiền) để critic/fuzz bắt được. Không đổi kết quả.
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-06
- Mức độ: Suggestion
- Vị trí: `attention-sources.ts` `checkoutDebtSource` + `CheckoutService.openDebtVndView`
- Vấn đề: mỗi dòng qua bộ lọc SQL tốn 4–5 truy vấn (đặt chỗ, số dư, folio, Σ giảm, và W_cũ nếu là nợ cũ). Với 10 căn thì chấp nhận được, trong ngân sách p95 < 300 ms. Khi chạy chuỗi cơ sở thì nên gom.
- Đề xuất sửa: ghi chú nợ kỹ thuật, chưa làm bây giờ. Khi `Folio.totals.openDebtVnd` vào hợp đồng, viết một hàm đọc lô dùng chung.
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-07
- Mức độ: Suggestion
- Vị trí: `ad7390c` – `folio-lines.service.ts` N-15
- Vấn đề: khi quá cửa sổ, kiểm N-15 đứng trước kiểm vai, nên FD nhận 409 `FOLIO_LOCKED` thay vì 403. Cả hai đều chặn, kết quả đúng.
- Đề xuất sửa: giữ như hiện tại, vì 409 đúng nghĩa hơn ("folio đã chốt"). FE-A chỉ cần biết A32 trên folio quá cửa sổ trả 409 cho mọi vai.
- Trạng thái: Open

---

## Trả lời 5 giả định BE-B (quyết định ARC, đã ghi decision-log 23/10)

1. **Đường đọc `openDebtVnd` cho nợ cũ = max(0, B − W_cũ): ĐỒNG Ý.** Đây là yêu cầu của bất biến I3 (O của mã = O của hàm tham chiếu) và của nguyên tắc "một định nghĩa công nợ". Nếu đường đọc vẫn trả B thì 208 sẽ chặn sai việc giảm khoản cửa sổ trên folio nợ cũ, còn trần xóa nợ sẽ cao hơn số DOM cho phép. Phạm vi: áp cho `cycleOpenDebtVnd` và `openDebtVnd` khi còn trong cửa sổ. Hết cửa sổ thì vẫn O = B như mọi folio. Coi đây là bổ sung cho s1-contracts 5.2: "biến thể đọc dùng cùng X".
2. **N-15 chặn cả A32 tăng khi quá cửa sổ: ĐỒNG Ý.** 16.31.1 chốt "quá `post_checkout_window_until` coi như `closed`", và 16.28 chốt folio `closed` không cho điều chỉnh dòng nào, mọi vai. Có ba lý do. (a) `lockForPosting` đã chặn ghi dòng mới theo giờ, nên cho A32 tăng sẽ thành cửa sau để ghi phí sau khi chốt. (b) Phần tăng đó sẽ thành công nợ khi J15 chạy, nên lẽ ra phải có nhật ký ghi nợ riêng. (c) Sửa sau chốt cần hóa đơn điều chỉnh (R3 cùng HĐĐT). Việc BE-B đổi `reversal-debt-g4` bước D+2 sang 409 là đúng. SEC xác nhận phần này khi review 208.
3. **`debt_opened_at` = `actual_checkout_at` cho chu kỳ nợ cũ: ĐỒNG Ý.** s1-contracts 5.2 cho phép dùng giờ trả phòng khi không đọc được audit cũ. Frontdesk không có cổng đọc audit, và không nên mở cổng chỉ cho dữ liệu demo/QA. Cột này không vào phép tính nào: O dùng `recorded` và `base`, BR-433 (a) cộng mọi chu kỳ theo folio.
4. **"Cần chú ý" giữ lọc SQL `debt_settled_at IS NULL` làm bộ lọc rẻ: ĐỒNG Ý, với điều kiện.** Bộ lọc chỉ hợp lệ khi nó là tập lớn hơn tập O > 0, và quyết định cuối vẫn theo số. Lý do nó là tập lớn hơn: `debt_settled_at` chỉ được ghi (`debtSettled`) khi B ≤ 0 sau một khoản thu hoặc xóa nợ. Mọi lần tăng nợ sau đó đều qua `writeDebt`, mà hàm này đặt lại NULL. Còn khoản cửa sổ phát sinh sau đó là W, không phải O. Kẽ hở duy nhất là R − D > B lúc settle. Trạng thái đó cần một lần giảm B không nằm trong D trên folio đang nợ: FOC thường thì bị chặn trên `settled`/`closed` (`foc.service` chỉ cho `debt_write_off`), còn A32 giảm thì R2 N-7 chặn khi có nợ và 208 giới hạn ≤ W. Vì vậy hiện không với tới được. Điều kiện kèm theo: thẻ S1-04 (bỏ `debt_settled_at` khỏi `openDebt` cùng 208) và bất biến fuzz mới "`debt_settled_at` NOT NULL ⇒ `cycleOpenDebtVnd` = 0".
5. **Tuần tự hóa A32 giảm bằng If-Match + khóa folio: ĐỒNG Ý, nhưng ghi đúng cơ chế.** Thứ bảo đảm tiền là **đọc B/O/W dưới L1 → L3** (`lockStay`) và so version **dưới L3** (đã kiểm ở `ad7390c`: `VERSION_CONFLICT` kiểm sau `lockStay`). If-Match chỉ làm lần thứ hai fail sớm. Nếu lần thứ hai mang ETag mới, nó vẫn đọc W đã giảm và nhận 409 `FOLIO_LOCKED`. Ca 208-G "hai lần giảm tổng vượt W → đúng một 409" dùng ETag mới cho mỗi lần, đúng nhánh này. Không cần thêm khóa riêng. Đua A32 giảm ‖ thu nợ: hai đường cùng lấy L1 → L3, nên chạy tuần tự.

## Điểm làm tốt
- Một điểm quyết định duy nhất trong `writeDebt`, bỏ cờ `keep`, nên người gọi không còn quyết thay. Đúng tinh thần 16.31.2 (b).
- Test bám đúng oracle DOM, gồm cả nhật ký, thông báo và hạn, cộng thêm ca đua ép thứ tự sau khóa folio. Báo cáo ghi rõ ánh xạ giờ và điều kiện gộp 208.
- `debtReductionsVnd` đếm cả khoản thu đã đảo, nhờ đó một lần đảo không thổi phồng X. Ranh giới N-15 (`now >= until`) khớp đúng ranh giới J15.
