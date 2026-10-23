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
- Trạng thái: Verified (ARC 23/10, `ab04462`)

### FB-R3-ARC-BEB-S1-02
- Mức độ: Minor
- Vị trí: `test/integration/s438-r8/fixture.ts` `j15Unit` (`hasOpenDebt: … !== null`) so với `folio/public/folio-close-job.ts` (`openDebtVnd > 0`)
- Vấn đề: `61dfdd5` đổi `hasOpenDebt` của J15 thật sang "theo số", nhưng fixture mà mọi ca 209 dùng vẫn giữ định nghĩa cũ (`openDebt !== null`). Như vậy lưới an toàn "J15 không ghi được nợ mà cũng không có nợ mở → throw" của bản chạy thật không được test nào đi qua.
- Vì sao quan trọng: đây đúng là lớp lỗi "hai định nghĩa song song" của lượt 8. Hiện hai định nghĩa cho cùng kết quả trong mọi trạng thái với được. Nhưng khi 208 phần còn lại cho `openDebt` trả `null` khi O = 0, chúng sẽ tách nhau mà test không thấy.
- Đề xuất sửa: cho `j15Unit` dùng chung hàm `hasOpenDebt` với `folio-close-job.ts` (xuất một hàm nhỏ, hoặc gọi đúng biểu thức `openDebtVnd > 0`). Ít nhất một ca 209 (209-E) chạy qua `runJ15` (JobRunner thật).
- Trạng thái: Verified (ARC 23/10, `ab04462`)

### FB-R3-ARC-BEB-S1-03
- Mức độ: Minor
- Vị trí: `checkout.service.ts` `writeDebt`, audit `reservation.debt_on_checkout` `after.openDebtVnd = openBeforeVnd + debtVnd`
- Vấn đề: số "công nợ sau" trong nhật ký tiền được **tính**, không **đọc lại** sau khi ghi. Nó chỉ bằng `cycleOpenDebtVnd` thật khi R − D ≤ B trước lần ghi (không bị kẹp). Với trạng thái có kẹp (R − D > B, như BE-B tự nêu ở giả định 4 của báo cáo), hai số khác nhau. Khi đó nhật ký nói một số, còn hàm đọc ra số khác.
- Vì sao quan trọng: critic và fuzz R3-Q30 dùng nhật ký này để đối chiếu I3/I5. Một số tự tính trong nhật ký tiền có thể che lệch thay vì làm lộ lệch.
- Đề xuất sửa: sau `UPDATE`, gọi lại `cycleOpenDebtVnd(tx, folioId, primaryAfter, balanceAfter)` rồi ghi số đó vào `after.openDebtVnd`. Chi phí là thêm 1–2 truy vấn trên đường hiếm (G-4, J15).
- Trạng thái: Verified (ARC 23/10, `ab04462`)

### FB-R3-ARC-BEB-S1-04
- Mức độ: Minor
- Vị trí: `checkout.service.ts` `openDebt` (vẫn `primary.debt_settled_at !== null → null`) so với `cycleOpenDebtVnd` (không đọc `debt_settled_at`)
- Vấn đề: sau `61dfdd5`, cổng `openDebt` (trần xóa nợ, nhánh thu nợ, N-7/208) vẫn coi chu kỳ "đã settled" là không nợ. Trong khi đó `writeDebt`/J15 đọc theo số. Trong mọi trạng thái với được, hai cách cho cùng kết quả (chứng minh ở câu trả lời giả định 4). BE-B đã ghi việc này ở "phần còn lại của 208".
- Vì sao quan trọng: nguyên tắc 16.31 là "không đọc `debt_settled_at` ở bất kỳ quyết định nào". Nếu để kéo dài, đây sẽ là định nghĩa thứ hai.
- Đề xuất sửa: làm cùng phần còn lại của 208 (`openDebt` → `null` khi `openDebtVnd` = 0, bỏ điều kiện `debt_settled_at`), không để sang Sprint 2. QA thêm bất biến fuzz: "`debt_settled_at` NOT NULL ⇒ `cycleOpenDebtVnd` = 0" (xem câu trả lời 4).
- Trạng thái: Verified (ARC 23/10, `ab04462`)

### FB-R3-ARC-BEB-S1-05
- Mức độ: Suggestion
- Vị trí: `checkout.service.ts` `cycleOpenDebtVnd`
- Vấn đề: lần kẹp `min(open, owed)` che mọi trạng thái R − D > B. Hiện trạng thái này không với tới được, nhưng nếu một đường tiền mới (thu hồi FOC Sprint 2, cổng thanh toán R3) làm nó xuất hiện thì không ai biết.
- Đề xuất sửa: khi `open > owed` (kẹp có tác dụng), ghi log cảnh báo có cấu trúc (`debt.clamped`, folioId, chỉ số tiền) để critic/fuzz bắt được. Không đổi kết quả.
- Trạng thái: Closed – Rejected cho Sprint 1, ARC chấp nhận lý do (ghi checklist 16.31.3)

### FB-R3-ARC-BEB-S1-06
- Mức độ: Suggestion
- Vị trí: `attention-sources.ts` `checkoutDebtSource` + `CheckoutService.openDebtVndView`
- Vấn đề: mỗi dòng qua bộ lọc SQL tốn 4–5 truy vấn (đặt chỗ, số dư, folio, Σ giảm, và W_cũ nếu là nợ cũ). Với 10 căn thì chấp nhận được, trong ngân sách p95 < 300 ms. Khi chạy chuỗi cơ sở thì nên gom.
- Đề xuất sửa: ghi chú nợ kỹ thuật, chưa làm bây giờ. Khi `Folio.totals.openDebtVnd` vào hợp đồng, viết một hàm đọc lô dùng chung.
- Trạng thái: Closed – Accepted, nợ kỹ thuật

### FB-R3-ARC-BEB-S1-07
- Mức độ: Suggestion
- Vị trí: `ad7390c` – `folio-lines.service.ts` N-15
- Vấn đề: khi quá cửa sổ, kiểm N-15 đứng trước kiểm vai, nên FD nhận 409 `FOLIO_LOCKED` thay vì 403. Cả hai đều chặn, kết quả đúng.
- Đề xuất sửa: giữ như hiện tại, vì 409 đúng nghĩa hơn ("folio đã chốt"). FE-A chỉ cần biết A32 trên folio quá cửa sổ trả 409 cho mọi vai.
- Trạng thái: Closed – Done

---

## Trả lời 5 giả định BE-B (quyết định ARC, đã ghi decision-log 23/10)

1. **Đường đọc `openDebtVnd` cho nợ cũ = max(0, B − W_cũ): ĐỒNG Ý.** Đây là yêu cầu của bất biến I3 (O của mã = O của hàm tham chiếu) và của nguyên tắc "một định nghĩa công nợ". Nếu đường đọc vẫn trả B thì 208 sẽ chặn sai việc giảm khoản cửa sổ trên folio nợ cũ, còn trần xóa nợ sẽ cao hơn số DOM cho phép. Phạm vi: áp cho `cycleOpenDebtVnd` và `openDebtVnd` khi còn trong cửa sổ. Hết cửa sổ thì vẫn O = B như mọi folio. Coi đây là bổ sung cho s1-contracts 5.2: "biến thể đọc dùng cùng X".
2. **N-15 chặn cả A32 tăng khi quá cửa sổ: ĐỒNG Ý.** 16.31.1 chốt "quá `post_checkout_window_until` coi như `closed`", và 16.28 chốt folio `closed` không cho điều chỉnh dòng nào, mọi vai. Có ba lý do. (a) `lockForPosting` đã chặn ghi dòng mới theo giờ, nên cho A32 tăng sẽ thành cửa sau để ghi phí sau khi chốt. (b) Phần tăng đó sẽ thành công nợ khi J15 chạy, nên lẽ ra phải có nhật ký ghi nợ riêng. (c) Sửa sau chốt cần hóa đơn điều chỉnh (R3 cùng HĐĐT). Việc BE-B đổi `reversal-debt-g4` bước D+2 sang 409 là đúng. SEC xác nhận phần này khi review 208.
3. **`debt_opened_at` = `actual_checkout_at` cho chu kỳ nợ cũ: ĐỒNG Ý.** s1-contracts 5.2 cho phép dùng giờ trả phòng khi không đọc được audit cũ. Frontdesk không có cổng đọc audit, và không nên mở cổng chỉ cho dữ liệu demo/QA. Cột này không vào phép tính nào: O dùng `recorded` và `base`, BR-433 (a) cộng mọi chu kỳ theo folio.
4. **"Cần chú ý" giữ lọc SQL `debt_settled_at IS NULL` làm bộ lọc rẻ: ĐỒNG Ý, với điều kiện.** Bộ lọc chỉ hợp lệ khi nó là tập lớn hơn tập O > 0, và quyết định cuối vẫn theo số. Lý do nó là tập lớn hơn: `debt_settled_at` chỉ được ghi (`debtSettled`) khi B ≤ 0 sau một khoản thu hoặc xóa nợ. Mọi lần tăng nợ sau đó đều qua `writeDebt`, mà hàm này đặt lại NULL. Còn khoản cửa sổ phát sinh sau đó là W, không phải O. Kẽ hở duy nhất là R − D > B lúc settle. Trạng thái đó cần một lần giảm B không nằm trong D trên folio đang nợ: FOC thường thì bị chặn trên `settled`/`closed` (`foc.service` chỉ cho `debt_write_off`), còn A32 giảm thì R2 N-7 chặn khi có nợ và 208 giới hạn ≤ W. Vì vậy hiện không với tới được. Điều kiện kèm theo: thẻ S1-04 (bỏ `debt_settled_at` khỏi `openDebt` cùng 208) và bất biến fuzz mới "`debt_settled_at` NOT NULL ⇒ `cycleOpenDebtVnd` = 0".
5. **Tuần tự hóa A32 giảm bằng If-Match + khóa folio: ĐỒNG Ý, nhưng ghi đúng cơ chế.** Thứ bảo đảm tiền là **đọc B/O/W dưới L1 → L3** (`lockStay`) và so version **dưới L3** (đã kiểm ở `ad7390c`: `VERSION_CONFLICT` kiểm sau `lockStay`). If-Match chỉ làm lần thứ hai fail sớm. Nếu lần thứ hai mang ETag mới, nó vẫn đọc W đã giảm và nhận 409 `FOLIO_LOCKED`. Ca 208-G "hai lần giảm tổng vượt W → đúng một 409" dùng ETag mới cho mỗi lần, đúng nhánh này. Không cần thêm khóa riêng. Đua A32 giảm ‖ thu nợ: hai đường cùng lấy L1 → L3, nên chạy tuần tự.

## Xác nhận sau Phản hồi & sửa (ARC 23/10, head `ab04462`)

Đã đọc `rounds/round-03/responses/s1-BE-B.md` và diff mã của `78cecef` (fix 210) + `e5c8258` (208 sửa theo review). Đã chạy lại trên worktree tách riêng và PostgreSQL riêng: `tsc` đạt; `s438-r8/*` + `reversal-debt-g4` + `s4-recheck6-be-a` **73/73**.

1. **`OpenDebt.cycleOpened` – ĐỒNG Ý.** Trường chỉ thêm vào cổng nội bộ `ReservationHooks`, không đổi OpenAPI, không lộ ra client. Nghĩa đúng: `false` = nợ ghi trước 0076, số của nó suy ngược từ dòng (W_cũ). Lúc đó A32 giữ N-7 của R2 và chặn mọi lần giảm, tới khi một lần ghi nợ mở chu kỳ. Đây là cách an toàn: quyền giảm không dựa vào một số suy ngược. Dữ liệu này chỉ có ở demo/QA, nên không ảnh hưởng vận hành thật. Ghi thêm vào s1-contracts 5.2 cùng bổ sung ở giả định 1.
2. **S1-01…S1-04 – đã sửa đúng:**
   - S1-01: có ca "210-A32" (chuỗi 3 dòng + khoản cửa sổ được A32 nâng), cộng ca SEC S5 (70 lần tăng). Trần chuỗi `WINDOW_CHAIN_MAX_DEPTH` = 64; chuỗi bị cắt tính 0, nên W chỉ có thể nhỏ đi và O không bao giờ giảm. Đúng hướng an toàn.
   - S1-02: `hasOpenDebtByNumber` dùng chung cho J15 thật và hai fixture; 209-E chạy qua `runJ15`.
   - S1-03: `after.openDebtVnd` đọc lại dòng sau `UPDATE` rồi gọi `cycleOpenDebtVnd`. Đúng B sau ghi (`d.balanceDueVnd` là số dư sau đảo / lúc J15).
   - S1-04: `openDebt` bỏ `debt_settled_at`, trả `null` khi O = 0. Hệ quả 208-E (409) và nhánh thu thường cho chu kỳ nằm im đúng 16.31.1. Thu đủ trong nhánh thường không ghi `debt_settled_at`, nhưng bộ lọc SQL "dòng > thu" vẫn loại folio đó khỏi "Cần chú ý", và J15 đóng khi B = 0. Không lệch.
   - Kiểm tra thêm ở 208: bất biến chạy lúc ghi ("O sau A32 không được nhỏ hơn O trước", nếu vi phạm thì rollback) và `actorRole` trong nhật ký tiền – đồng ý.
3. **`Folio.totals.openDebtVnd` (SEC D.5) – XẾP VÀO "0.3.8 bổ sung 1"**, không dời sang Sprint 2. Lý do: FE-A cần số này cho hộp A32 trên folio `settled` (giới hạn giảm = W), điền sẵn trần xóa nợ và câu "Công nợ X · khoản trong cửa sổ Y". Thiếu nó, Desk chỉ dựa vào 409/422 `max`. Đây là trường thêm, tùy chọn, không phá client.
   - Hình dạng: `totals.openDebtVnd` (integer ≥ 0) và `totals.windowVnd` (= max(0, B) − O). Chỉ có trên folio `settled`/`closed` của lượt `checked_out`. `x-rbac-field`: FD+ và MGR+ (như `balanceDueVnd`); SAL/CTV/HK không thấy.
   - Nguồn số: `openDebtVnd` hiệu lực, biến thể đọc không khóa, cùng hàm với `openDebtVndView`.
   - ARC ghi vào hợp đồng ở đợt bổ sung 1 (D3). BE-B code **sau khi 208 gộp**, trong PR riêng, không gộp vào PR 208. Điều kiện gộp 208 không đổi (SEC D.1–D.2).

## Điểm làm tốt
- Một điểm quyết định duy nhất trong `writeDebt`, bỏ cờ `keep`, nên người gọi không còn quyết thay. Đúng tinh thần 16.31.2 (b).
- Test bám đúng oracle DOM, gồm cả nhật ký, thông báo và hạn, cộng thêm ca đua ép thứ tự sau khóa folio. Báo cáo ghi rõ ánh xạ giờ và điều kiện gộp 208.
- `debtReductionsVnd` đếm cả khoản thu đã đảo, nhờ đó một lần đảo không thổi phồng X. Ranh giới N-15 (`now >= until`) khớp đúng ranh giới J15.

---

# Mục mới – Review `29ce3d8`: BE-83 + ESC-026 A + R3-Q25 (ARC 23/10, PR tiền bắt buộc)

- Đối tượng: commit `29ce3d8` trên `worktree-agent-a4a7a7b47e3d900bf`, báo cáo `outputs/BE/s1-be-b.md` mục 8.
- Đối chiếu:
  - s1-contracts 5.3;
  - erd 4.15 `foc_stay_alert`;
  - OpenAPI 0.3.8-draft (`foc_stay_total_exceeded`);
  - DOM oracle mục 5.1–5.3 và **5.4 (BR-433 (d) v0.4.1, BB07-1…7, I16)**;
  - SEC `reviews/s1-SEC-on-BE-B.md` FB-R3-SEC-BE-B-07.

## Kết luận
**`29ce3d8` CHƯA gộp được.** Có 1 Blocker và 1 Major.
- **Blocker – S1-08**: ARC đồng ý thẻ FB-07 của SEC. Thiết kế kỹ thuật để sửa nằm ở mục "Hướng dẫn sửa FB-07" bên dưới.
- **Major – S1-09**: đổi số migration và gộp đúng danh sách kind thông báo. Đây là điều kiện bắt buộc lúc rebase.

Sửa xong hai thẻ này + test BB07-1…7 đạt + SEC xác nhận FB-07 thì gộp được.

Phần còn lại đúng hợp đồng 5.3:
- (a) Σ xóa nợ theo folio, mọi chu kỳ, kể cả yêu cầu đang chờ, đọc dưới L1 → L3;
- (b) Σ theo khóa;
- (c) báo OWN, không chặn, một mục "Cần chú ý" mỗi lượt, chạy trong hook quyết định dưới khóa folio. Hook này chạy cả khi tự áp (`runHooks` lúc `submit`) lẫn khi duyệt;
- R3-Q25 xác thực lại.

Đã chạy (worktree tách riêng ở `29ce3d8`, PostgreSQL riêng):
- `tsc` đạt;
- toàn bộ api `vitest run`: **107 tệp đạt (1 bỏ qua), 3.010 test đạt (2 bỏ qua)**;
- `drizzle-kit generate`: không sinh file.

## Thẻ feedback

### FB-R3-ARC-BEB-S1-08
- Mức độ: Blocker
- Vị trí: `folio/public/folio.service.ts` `folioNightBasisVnd`, `nightRateBasis`; người gọi: `foc.service.ts` (a)(b), `stay-waiver-alert.ts` (ngưỡng MGR), `frontdesk/internal/stay-support.ts` (FOC phụ thu tại quầy, BR-416)
- Vấn đề: cơ sở hạn mức đọc giá dòng `room` **đang sống**. Giá này MGR sửa được bằng A31 (khi khách còn ở) hoặc A32 (sau trả phòng). MGR chỉ cần nâng giá đêm lên, tự áp xóa nợ hoặc FOC lớn, rồi hạ giá về như cũ (ca SEC Q1 = BB07-1). Mọi bằng chứng còn lại trông hợp lệ. DOM đã chốt BR-433 (d) v0.4.1: giá đêm bảo vệ = min(giá dòng hiện hành, giá tham chiếu server tính); từ B18 cơ sở = min(số chụp lúc B18, cơ sở tính lại).
- Vì sao quan trọng: lách hạn mức duyệt BR-433, tức sai tiền và vô hiệu ESC-026 A (ngưỡng MGR cũng nâng theo).
- Đề xuất sửa: theo "Hướng dẫn sửa FB-07" bên dưới (cột mới gộp vào migration 0080 của BE-B; một cổng `limitBasisVnd`; ràng buộc CHECK để fail-closed).
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-09
- Mức độ: Major (điều kiện gộp)
- Vị trí: `db/migrations/0079_foc_stay_alert.sql`, `db/schema/frontdesk.ts` `STAFF_NOTIFICATION_KINDS` / `staff_notification_kind_check`
- Vấn đề: migration viết lại **toàn bộ** danh sách CHECK. Có hai nhánh khác cũng tự viết lại danh sách này:
  - landing T13 (`0079_public_site_t13.sql`, có thêm `website_request_*`, `public_booking_toggled`);
  - BE-A US-164 (`manager_confirmation_*`, `late_fee_post_review`).

  2FA (BE-C, `0079_mfa_two_factor.sql`) không chạm CHECK này nhưng chiếm số 0079. Nhánh nào gộp sau mà không hợp danh sách thì sẽ xóa kind của nhánh trước. Khi đó mọi lần gửi thông báo kind đó vấp CHECK, giao dịch nghiệp vụ rollback và người dùng nhận 500.
- Vì sao quan trọng: lỗi chỉ lộ lúc chạy. `drizzle-kit generate` cũng không bắt được nếu schema TS bị ghi đè theo cùng cách.
- Đề xuất sửa (quy tắc ARC, áp cho mọi nhánh 0.3.8):
  1. Lúc rebase, lấy số migration kế tiếp trên `main`. Nếu ORC gộp 2FA trước thì là **0080**. Nếu T13 gộp trước thì lấy số sau nó.
  2. `STAFF_NOTIFICATION_KINDS` và CHECK = danh sách trên `main` lúc rebase **cộng thêm** kind mới. Diff của CHECK so với `main` chỉ được có dòng thêm.
  3. Thêm test (không cần DB) so tập kind trong SQL của migration mới nhất có CHECK này với `STAFF_NOTIFICATION_KINDS`. Nếu gộp được thì thêm test có DB: insert thử mỗi kind trong một giao dịch rồi rollback.
  4. Gộp luôn cột/ràng buộc của S1-08 và FK của S1-12 vào cùng migration này.
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-10
- Mức độ: Minor
- Vị trí: `frontdesk/internal/stay-support.ts` (FOC phụ thu tại quầy – `approvals.submit` type `foc` không có `perTimeAmountVnd`)
- Vấn đề: Σ của khóa (BR-433 (b)) chỉ được tính ở `foc.service`. Đường FOC tại quầy so hạn mức bằng số của riêng yêu cầu. Hiện đây gần như luôn là yêu cầu đầu tiên trên khóa (dòng phụ thu vừa ghi), nên kết quả trùng, nhưng hai nơi tự tính là mầm của hai định nghĩa. US-164 (BE-A) cũng sẽ thêm một đường FOC nữa.
- Đề xuất sửa: một hàm cổng folio, ví dụ `FolioService.waiverLimitInput(tx, lineId, amountVnd, kind)`, trả `{ perTimeAmountVnd, limitBasisVnd }` (cơ sở theo S1-08). Mọi người gọi `submit` type `foc`/`special_discount` đều dùng nó. Thêm test kiến trúc: mọi `approvals.submit` với hai type này phải truyền `perTimeAmountVnd`.
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-11
- Mức độ: Minor
- Vị trí: `folio/internal/stay-waiver-alert.ts` (lần vượt thứ hai trở đi)
- Vấn đề: US-007 AC7 viết: "mỗi lần vượt thêm cập nhật cùng một dòng". Mã hiện chỉ tăng `foc_stay_alert.alert_count`; mục "Cần chú ý" giữ `params.count` của lần đầu. Ngoài ra, sau khi OWN bấm "Đã xem", lần vượt sau không mở lại mục (giả định 5).
- Đề xuất sửa (ARC quyết giả định 5):
  - mục còn mở → cập nhật `details.count` (và `updated_at`) của chính sự kiện đó;
  - mục đã "Đã xem" → mở **một** mục mới (dedupe theo lượt) và cập nhật `foc_stay_alert.attention_event_id`.

  Lý do: OWN đã xem tập khoản cũ, khoản mới chưa ai xem; thông báo đẩy không thay được dòng việc cần làm. Không spam vì vẫn tối đa một mục mở mỗi lượt.
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-12
- Mức độ: Minor
- Vị trí: `0079_foc_stay_alert.sql` – `stay_root_reservation_id` không có FK
- Vấn đề: khóa chính trỏ đơn gốc nhưng không có ràng buộc tham chiếu. Các bảng cùng loại đều có FK tới `reservation`.
- Đề xuất sửa: thêm FK `(stay_root_reservation_id) REFERENCES reservation(id)` trong migration đã đổi số. Không cần `ON DELETE`, vì đơn không bị xóa (BR-008).
- Trạng thái: Open

### FB-R3-ARC-BEB-S1-13
- Mức độ: Suggestion (việc của ARC, 0.3.9)
- Vị trí: hợp đồng `AttentionItem.params` của `foc_stay_total_exceeded` (hiện chỉ có `count`)
- Vấn đề: AC7 muốn dòng hiện tổng miễn và hạn mức. Hợp đồng 0.3.8 ARC chỉ cho `count`. Hiện Desk lấy chi tiết qua danh sách yêu cầu duyệt của đơn.
- Đề xuất: 0.3.9 xem xét thêm `stayWaiverVnd`, `thresholdVnd` (chỉ số tiền, mục chỉ dành cho OWN, SEC J cho phép). BE không làm ở Sprint 1.
- Trạng thái: Open

## Quyết định ARC cho ba điểm ORC hỏi

1. **Nhật ký cảnh báo: giữ loại `state`** (`folio.foc_stay_alerted`), không thêm vào tập `money`. Tập `money` đóng theo hợp đồng và chỉ gồm thao tác **làm đổi tiền**. Cảnh báo không đổi đồng nào. Mỗi khoản miễn được áp đã có nhật ký `money` của riêng nó (`approval.self_applied` / `approved` có `cumulativeVnd`, dòng FOC). Đưa cảnh báo vào `money` sẽ làm nhiễu đối soát và câu `mlog`. **PO sửa chữ US-007 AC7**: thay "Nhật ký `money` ghi lần cảnh báo" bằng "nhật ký ghi lần cảnh báo (loại `state`, kèm Σ, ngưỡng, số khoản); mỗi khoản miễn có nhật ký `money` riêng". Không đổi hành vi với INV.
2. **"Lượt ở" = folio của đơn gốc: đồng ý**, khớp erd 4.15 (đơn con dùng chung folio – BR-422).
   - Dài hạn: ở Sprint 1 tính theo folio hiện tại. Nếu một đơn HĐ có nhiều folio theo kỳ thì Σ sẽ tách theo kỳ. Ghi `[GIẢ ĐỊNH – chờ DOM]`; Sprint 2 gom theo đơn HĐ (khóa `foc_stay_alert` đã theo đơn gốc, chỉ phải đổi truy vấn Σ).
   - Folio 0 đêm: ngưỡng MGR = 0, tức luôn báo OWN. **Đồng ý**, vì đi theo hướng an toàn và chỉ là thông báo. Sau S1-08, "không có đêm" được hiểu là cổng `limitBasisVnd` trả `null`. Khi đó (a)/(b) chuyển OWN như trước, còn (c) dùng ngưỡng 0.
   - Giả định 2 (khoản đã duyệt nhưng đang "ngủ", áp 0, không tính vào Σ khóa): **đồng ý**, vì Σ là số đang áp và đang xin.
3. **Migration**: xem S1-09. Ghi chú bổ sung cho ORC: số là **0080 nếu ORC gộp 2FA trước**. CHECK kind phải là hợp các kind trên `main` lúc rebase cộng kind mới. Nhánh T13 (`0079_public_site_t13`) và BE-A US-164 cũng viết lại CHECK, nên nhánh nào gộp sau thì phải hợp danh sách lại. Reviewer chỉ chấp nhận diff CHECK có dòng thêm.

## Hướng dẫn sửa FB-07 (thiết kế kỹ thuật ARC – BR-433 (d) v0.4.1; ghi vào s1-contracts 12 mục 4 và erd 4.15)

**Nguyên tắc:** cơ sở hạn mức là **một hàm cổng duy nhất**, đọc từ **giá tham chiếu do hệ thống ghi**. Không đường sửa tay nào ghi được giá tham chiếu. CHECK ở DB bảo đảm thiếu giá tham chiếu thì không ghi được dòng, tức fail-closed.

**Dữ liệu (gộp vào migration 0080 của BE-B, cùng `foc_stay_alert`):**

| Cột | Ý nghĩa | Ai ghi |
|---|---|---|
| `stay_night.reference_rate_vnd` bigint NOT NULL, CHECK ≥ 0 | Giá đêm tham chiếu **cùng đơn vị với `room_revenue_gross_vnd`** (sau BR-107/BR-111). Gồm giá thỏa thuận chụp lúc đặt (BR-006, G-5), lịch giá Trực tiếp, giá OTA, giá đêm quy đổi dài hạn | Chỉ các đường giá của hệ thống trong `reservations`: tạo đơn, đổi ngày/thêm bớt đêm, B14 đổi căn theo yêu cầu khách (BR-424 – BB07-5), gia hạn, đêm thêm sớm/muộn, tính lại bậc BR-107, đồng bộ OTA. B7 (OTTIMO đổi căn) **giữ** giá tham chiếu cũ (BR-429). **A31 `setNightRate` không ghi cột này** |
| `folio_line.limit_ref_vnd` bigint NULL, CHECK ≥ 0, và CHECK `(category <> 'room' AND charge_code IS DISTINCT FROM 'late_fee_as_night') OR limit_ref_vnd IS NOT NULL` | Giá tham chiếu mang theo dòng | Dòng `room` do đồng bộ đêm ghi = `stay_night.reference_rate_vnd`. Dòng `late_fee_as_night` = số máy tính lúc ghi (BR-416, ESC-024 B). **Dòng thay của A32** chép `limit_ref_vnd` của dòng bị thay, **không** lấy giá mới |
| `folio.limit_basis_checkout_vnd` bigint NULL, CHECK ≥ 0 | Cơ sở chụp lúc B18 | Ghi **một lần** trong cùng giao dịch `settle` (`folio.service.ts` – nơi duy nhất đặt `status = 'settled'`) = `limitBasisVnd` tính ngay lúc đó. Không đường nào sửa sau. Hiện không có "hoàn tác trả phòng"; nếu sau này có thì đường đó xóa cột và B18 kế tiếp chụp lại |

Backfill trong 0080:
- `stay_night.reference_rate_vnd = room_revenue_gross_vnd`;
- `folio_line.limit_ref_vnd` của dòng `room` = giá tham chiếu của đêm nối qua `stay_night_id` (không nối được thì `unit_price_vnd`); dòng `late_fee_as_night` = `amount_vnd`;
- `folio.limit_basis_checkout_vnd` để NULL, nghĩa là chỉ dùng cơ sở tính lại.

Dữ liệu cũ chỉ có ở demo/QA (staging dựng từ DB trống – OPS C2), chấp nhận giá trị backfill. Thêm `NOT NULL` và CHECK **sau** câu backfill, trong cùng migration.

**Cổng (thay `nightRateBasis` + `folioNightBasisVnd`; xóa hai tên cũ để không còn ai đọc giá chưa bảo vệ):**
```ts
// FolioService (public) – BR-433 (d) v0.4.1
limitBasisVnd(tx: Tx, folioId: string, lineId: string | null): Promise<number | null>
```
- Giá bảo vệ của một dòng đêm = `LEAST(<giá dòng như hiện nay>, limit_ref_vnd)`. Dòng `room` dùng `unit_price_vnd`, dòng `late_fee_as_night` dùng `amount_vnd`.
- `lineId` ≠ null (BR-433 (b), BR-416): đi đúng nhánh của `nightRateBasis` hiện nay (đêm của dòng; phụ thu muộn = đêm cuối; phụ thu sớm = đêm đầu; dài hạn = giá quy đổi), nhưng mỗi giá thay bằng giá bảo vệ.
- `lineId` = null (BR-433 (a), ngưỡng MGR của (c)) = **max giá bảo vệ** của dòng đêm sống và `late_fee_as_night`, hoặc giá quy đổi dài hạn.
- Nếu `folio.limit_basis_checkout_vnd` NOT NULL thì kết quả = `min(kết quả, số chụp)` (BB07-7).
- `null` = không có đêm nào: (a)(b) chuyển OWN như trước; (c) dùng ngưỡng 0.

Người gọi dùng đúng cổng này và không ai tự tính:
- `foc.service` (a)(b), qua hàm của S1-10;
- `stay-waiver-alert.threshold` (nhánh MGR);
- `stay-support` FOC phụ thu tại quầy;
- US-164 của BE-A khi cài.

**Khóa và đua:** cổng đọc dưới L1 → L3 người gọi đã giữ. A31/A32 cũng lấy L3, nên "nâng giá ‖ xin xóa nợ" chạy tuần tự. Kể cả như vậy, kết quả cũng không phụ thuộc thứ tự, vì giá tham chiếu không đổi theo sửa tay.

**Test bắt buộc (BE-B, cùng PR):**
- BB07-1…7 đúng số oracle 5.4 (BB07-1 cả ba bước, cuối B = O = 5.000.000, Σ xóa nợ đã áp 0);
- test kiến trúc: chỉ các hàm giá của hệ thống trong `reservations` được `UPDATE`/`INSERT` `reference_rate_vnd`; chỉ `settle` được ghi `limit_basis_checkout_vnd`; câu `UPDATE stay_night` của `setNightRate` không chứa `reference_rate_vnd`;
- test DB: chèn dòng `room` thiếu `limit_ref_vnd` → lỗi CHECK;
- QA thêm I16 vào fuzz R3-Q30, fixture BR-433-11…15 `pendingFix R3-SEC-BE-B-07`.

**Hợp đồng:** không đổi hình dạng OpenAPI (cổng nội bộ, cột không lộ ra DTO). Đổi mô tả `openapi.yaml` (đoạn nhắc `nightRateBasis` của `requestFoc` xóa nợ): "cơ sở hạn mức bảo vệ BR-433 (d)". Phần này ARC làm ở lần sinh lại kế tiếp của 0.3.8 bổ sung 1. Erd 4.15 đã ghi ba cột.

SEC review lại PR sửa trên head SHA (FB-07), đặc biệt ca BB07-1 và test kiến trúc.
