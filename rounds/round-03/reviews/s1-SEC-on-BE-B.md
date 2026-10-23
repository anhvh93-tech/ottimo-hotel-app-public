# SEC review – BE-B lượt kiểm tiền R3 Sprint 1 (210 + 209, phần folio-lines của 208)

- Người review: SEC | Ngày: 23/10/2026 | Round 3 Sprint 1 – Bước Review; **review lại ở Bước Phản hồi & sửa, head `ab04462`** (mục ngay dưới)
- Nhánh: `worktree-agent-a4a7a7b47e3d900bf` (chưa push). Commit được review:
  - `61dfdd5` – BUG-R2-210 + BUG-R2-209 (`writeDebt`, `cycleOpenDebtVnd`, J15, "Cần chú ý");
  - **`ad7390c` – BUG-R2-208 phần `folio-lines` + N-15 (head SHA được review)**. `d94e5e9` phía trên chỉ thêm `rounds/round-03/outputs/BE/s1-be-b.md`, không đổi mã.
- Căn cứ: `outputs/SEC/s1-security-requirements.md` mục D; `round-02/reviews/s4-SEC.md` mục F; báo cáo `outputs/BE/s1-be-b.md`.
- Tên tệp: SEC D.2 ghi `SEC-on-BE-208.md`; ORC giao tên `s1-SEC-on-BE-B.md`. Tệp này thay cho cả hai.
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả của fixture. Không có số tài khoản, bí mật hay dữ liệu thật trong tệp.

## Review lại – 23/10/2026, head `ab04462` (Bước Phản hồi & sửa)

- Nhánh `worktree-agent-a4a7a7b47e3d900bf` đã rebase lên `main` `978c62f`. Các commit nằm trên `978c62f`:
  - `23aec2f`: 208, chính là `ad7390c` cũ. `git range-diff` cho thấy patch giống hệt, nên phần review lượt đầu vẫn còn giá trị;
  - `ad3ce7b`: báo cáo;
  - `78cecef`: fix 210;
  - `e5c8258`: 208 sửa theo review;
  - `ab04462`: trả lời thẻ.
- SEC review toàn bộ diff `978c62f..ab04462` trong `product/` (13 tệp) và đọc `rounds/round-03/responses/s1-BE-B.md`.
- `main` đã sang `2dd51cc`. Phần chênh so với `978c62f` chỉ gồm tài liệu, OpenAPI và api-client sinh tự động (`Folio.totals.openDebtVnd`, addendum 0.3.8), không chạm `product/services/api/src`. Gộp nhánh không đụng mã đã review.

### Kết luận lượt lại

| Hạng mục | Kết luận SEC |
|---|---|
| **"210 Verified" (D.1)** | **CẤP** trên `78cecef` (fix 210): `openDebtVnd` của dữ liệu trước 0076 không còn tụt sau chuỗi A32 dài. Chuỗi bị cắt chỉ làm O lớn lên, tức sai về phía an toàn. Xem kiểm P1. |
| **208 (`23aec2f` + `e5c8258`), điều kiện D** | **ĐẠT D.1–D.4**, gộp được ở head `ab04462`. D.5 (`Folio.totals.openDebtVnd` chỉ cho FD+) chưa có mã, SEC kiểm khi BE làm. D.3 (e) và D.6 (fuzz R3-Q30, BE-83) vẫn chờ: lượt kiểm tiền chưa "đạt" chung cho tới khi xong hai việc này, nhưng chúng không chặn gộp 208. |
| **Gộp** | **Gộp được cả nhánh ở head `ab04462`**, bằng merge giữ SHA. Gộp kiểu khác (squash, cherry-pick fix 210 riêng) mà patch giữ nguyên thì SEC chỉ xác nhận lại, có diff thêm thì review phần thêm. |
| Thẻ Blocker/Major còn mở | **Không còn.** |

### Kiểm đã chạy (lượt lại)

Chạy trên Postgres 17 riêng của SEC (container tạm, đã xóa), role `ottimo_app`.

1. `tsc --noEmit`: đạt.
2. **Toàn bộ api `vitest run` ở `ab04462`: 106 tệp đạt, 1 bỏ qua; 2.996 test đạt, 2 bỏ qua; 0 lỗi.** Gồm 3 ca `x.race` mới, các ca trước 0076, 208-E và 210-A32.
3. SEC tự viết test dò tạm, không commit, đã xóa (worktree sạch):
   - **P1** (dữ liệu trước 0076, chuỗi 70 lần A32 trên dòng phòng, vượt trần 64):
     - O = 170.000 ≥ 100.000 ban đầu. Không tụt, chỉ lớn lên như thiết kế "an toàn khi lỗi";
     - void dòng phòng → 409; giảm 1 đồng → 409; void minibar → 409.
   - **P2** (đơn có chu kỳ, chuỗi 70 lần A32 trên khoản cửa sổ):
     - void khoản đã nâng (140.000 = W) → 201, B = O = 100.000;
     - sau đó giảm phòng 1 đồng → 409;
     - nhật ký `folio_line.adjusted` có `actorRole: manager`, `openDebtVnd` trước 100.000 và sau 100.000 (đo lại).

### Đọc mã các bản sửa

- **FB-01 (a), `windowChargesVnd`:** lá nào chạm trần 64 mà phía trên còn dòng bị thay cùng loại thì đóng góp 0, không bao giờ tính cả dòng. Mỗi chuỗi có tối đa một dòng gốc không phải `post_checkout` (đệ quy dừng ở đó), nên `LIMIT 1` đúng.
- **FB-01 (b), `OpenDebt.cycleOpened`:** khi chưa có chu kỳ thì mọi lần giảm bị 409, trước cả so sánh W. ARC đã xác nhận cổng (`2dd51cc`). `openDebt` trả `null` chỉ khi O ≤ 0, mà O = 0 là thật: muốn đẩy W_cũ ≥ B mà không có thu tiền thì phải là A32 tăng, nhưng A32 tăng làm B tăng cùng lượng.
- **Bất biến lúc chạy:** O được đo lại sau `syncReductions`, cùng giao dịch và cùng khóa. Nếu O sau < O trước thì ném lỗi, rollback toàn bộ. Log chỉ có id folio, không có số tiền của khách.
- **ARC S1-04, `openDebt` không đọc `debt_settled_at`:** rà lại đường thu tiền (`payments.service.ts` nhánh `debtCollection`). Chu kỳ nằm im (O = 0) thì đi nhánh thu thường trong cửa sổ, sau cửa sổ thì O = B > 0. Không mở đường mới. FOC `debt_write_off` khi O = 0 → 409 thay cho 422.
- **Nhận xét, không lập thẻ:**
  - Với dữ liệu trước 0076 có chuỗi bị cắt, O cao hơn thực tế (P1: 170.000 so với 100.000). Trần `debt_write_off` vì thế cao hơn phần nợ thật một khoản bằng các lần tăng không truy được. Đây là sai về phía an toàn, vẫn phải qua hạn mức BR-433 hoặc OWN và có nhật ký.
  - Lần ghi nợ kế tiếp sẽ chốt số này vào chu kỳ, nên các khoản tăng đó được tính là nợ. Chấp nhận được, vì khách vẫn nợ số đó.
  - Chỉ xảy ra với dữ liệu trước 0076 và chuỗi trên 64 lần A32.

### Trạng thái thẻ (người review xác nhận)

| ID | Mức | Trạng thái BE | SEC xác nhận |
|---|---|---|---|
| FB-R3-SEC-BE-B-01 | Blocker | Done | **Verified** (`78cecef` + `e5c8258`; P1, P2, test PR) |
| FB-R3-SEC-BE-B-02 | Major | Done | **Verified** (3 ca `x.race`: hai thứ tự, deadlock +0, không 5xx; 412 chấp nhận theo giả định đã ghi) |
| FB-R3-SEC-BE-B-03 | Minor | Done | **Verified** (O sau đo lại, `actorRole`, rollback khi vi phạm bất biến; `reservation.debt_on_checkout` cũng đo lại) |
| FB-R3-SEC-BE-B-04 | Minor | Done | **Verified** (report trỏ đúng tệp; SHA mới được review ở đây) |
| FB-R3-SEC-BE-B-05 | Suggestion | Chuyển DOM/ARC | Đồng ý chuyển; **còn mở** chờ DOM, không chặn |
| FB-R3-SEC-BE-B-06 | Suggestion | Done (ARC xác nhận) | Verified |

---

## Kết luận lượt đầu (ad7390c – giữ để truy vết)

| Commit | Kết luận SEC |
|---|---|
| `61dfdd5` (210 + 209) | Không có Blocker nếu đứng riêng, gộp được khi CI xanh và QA xác nhận. **Chưa cấp "210 Verified" cho điều kiện D.1**: `openDebtVnd` tính sai trên dữ liệu ghi trước 0076 sau hơn 50 lần A32 (FB-01). |
| `ad7390c` (208 folio-lines) | **CHƯA ĐẠT điều kiện D. Không gộp**, kể cả sau `61dfdd5`. Có 1 Blocker (FB-01: xóa được nợ cũ không qua OWN) và 1 Major (FB-02: thiếu test đua thật trong PR). |

Sau khi sửa FB-01 và FB-02, SEC review lại phần diff thêm trên head SHA mới (D.2).

## Kiểm đã chạy

Chạy trên Postgres 17 riêng của SEC (container tạm, đã xóa), role `ottimo_app`, migration bằng `ottimo_migrator`.

1. Test của BE: `r3-folio-lines-208`, `r3-debt-210-209`, `reversal-debt-g4`: **43/43 đạt**.
2. SEC tự viết test dò tạm, không commit, đã xóa khỏi worktree (worktree sạch):
   - **S1, S1b:** đua thật bằng `x.interleaved`. Hai A32 giảm (void minibar 70.000 và giảm phòng 40.000) bị ép xếp hàng sau khóa folio, chạy 3 vòng cùng If-Match, thêm 1 vòng mỗi request tự đọc etag. Kết quả luôn là `201` và `412 VERSION_CONFLICT`. O giữ 100.000, B ≥ O.
   - **S2:** đua void minibar với đảo khoản thu (G-4), chạy hai thứ tự. Kết quả `201 + 200`, cuối cùng B = O = 100.000. Hoặc `200 + 412`. O luôn 100.000.
   - **S3:** fuzz nhỏ, 3 × 18 thao tác ngẫu nhiên (tăng, giảm, void) không có thu tiền. O không bao giờ giảm. B ≥ O. Mọi lần giảm được `201` đều ≤ W.
   - **S4:** tăng minibar thêm 1.000.000 rồi void dòng phòng 750.000. Kết quả `201`, O giữ nguyên, có audit đủ số (xem FB-05).
   - **S5:** dữ liệu trước 0076 với chuỗi A32 dài. **Lỗi**, xem FB-01.

## Đối chiếu điều kiện mục D

| # | Điều kiện | Trạng thái |
|---|---|---|
| D.1 | 208 chỉ gộp sau khi 210 đã gộp và SEC/QA Verified `openDebtVnd` trên dữ liệu trước 0076 | **Chưa đạt**: 210 chưa gộp; FB-01 cho thấy `openDebtVnd` của dữ liệu trước 0076 sai. 209 chung tệp với 208 nên đi trước (đúng thứ tự). |
| D.2 | SEC review trên head SHA sẽ gộp | Đã review `ad7390c`. Rebase lên `main` làm đổi SHA thì SEC kiểm lại: nếu patch giống hệt thì chỉ xác nhận, có thêm diff thì review phần thêm. |
| D.3 (a) | A32 tăng lặp rồi giảm vẫn 409, O không giảm | Đạt: 208-C, thêm S3 của SEC. Riêng dữ liệu trước 0076 **không đạt** (FB-01). |
| D.3 (b) | Biên W được, W+1 đồng bị 409 | Đạt: 208-C (90.000 → 201, 90.001 → 409), 208-B. |
| D.3 (c) | Hai A32 giảm song song cộng lại vượt W → đúng một bị từ chối, đọc dưới khóa | Logic đạt: đọc B và O sau L1 → L3, If-Match chặn lượt sau (S1, S1b, S2 của SEC). **Test trong PR chỉ chạy nối tiếp** (208-G), chưa có ca đua thật (FB-02). |
| D.3 (d) | `openDebt` trả `null` khi 0 mà không làm mất kiểm tra | Chưa tới lượt: thuộc phần còn lại của 208 (ARC 5.1 bước 3), chưa có trong `ad7390c`. Test đi kèm khi làm. |
| D.3 (e) | Đưa (a)–(c) vào fuzz R3-Q30 | Chờ QA, chạy trên bản có cả 210/209/208. |
| D.4 | Rà mọi đường ghi `folio_line` trên folio `settled` | Đạt cho dữ liệu có chu kỳ, **trừ lỗ FB-01** ở dữ liệu trước 0076. Kết quả rà ở mục "Rà đường ghi" bên dưới. Audit thiếu vai và số O "sau" đo thật (FB-03). |
| D.5 | `Folio.totals.openDebtVnd` chỉ cho FD+ | Chưa làm (phần còn lại của 208). Khi thêm, SEC kiểm vai đọc. |
| D.6 | Lượt kiểm tiền "đạt" khi cả 208 và BE-83 Verified và fuzz R3-Q30 chạy | Chưa. |

### Rà đường ghi `folio_line` trên folio `settled` trong cửa sổ (D.4)

| Đường | Tác động lên B và O | Kết quả |
|---|---|---|
| A32 `adjust` (giảm giá, giảm số lượng, void) | Có chặn theo số, đọc dưới L1 → L3. Nhánh đêm (`setNightRate`) chỉ chạy với booking `hold`/`confirmed`/`in_house`, không áp cho folio đã trả phòng | Đạt, trừ FB-01 |
| A32 tăng → `syncReductions` đăng lại FOC `debt_write_off` (BUG-R2-207) | Lượng đăng lại = min(đã duyệt, `applied_cap_vnd`, dòng). Không vượt trần | Đạt |
| `reverseLine(allowSettled)` | Chỉ gọi từ `folio-lines.service.ts:559` (A32) | Đạt |
| FOC hoặc giảm giá thường trên folio `settled` | `foc.service` trả 409 `FOLIO_LOCKED`. Chỉ `debt_write_off` qua được, có trần là O | Đạt |
| FOC còn chờ duyệt rồi được duyệt sau khi trả phòng | B18 chặn khi còn `pending_approvals`. FOC còn ngủ bị hủy khi settle | Đạt |
| Đếm lại minibar, `voidStay`, `resyncStay`, gán lại `syncStay` | Chỉ chạy trên folio `open` hoặc booking `in_house` | Đạt |
| Phí sau trả phòng, bồi thường hư hỏng, yêu cầu của khách (`lockForPosting(allowPostCheckout)`) | Chỉ làm tăng B | Đạt |
| Chuyển dòng sang folio khác | Không có endpoint | Không áp dụng |
| Thu tiền, đảo khoản thu | Thu tiền giảm B và O bằng nhau. Đảo khoản thu ghi nợ qua `writeDebt` | Đạt |

---

## Thẻ feedback

### FB-R3-SEC-BE-B-01
- Mức độ: **Blocker** (chặn gộp 208; D.1 chưa Verified)
- Vị trí: `product/services/api/src/modules/frontdesk/internal/checkout.service.ts` – `windowChargesVnd` (`61dfdd5`, CTE `chain`, điều kiện `c.depth < 50`). Đường khai thác mở ra ở `folio-lines.service.ts` `adjust` (`ad7390c`).
- Vấn đề:
  - Với nợ ghi trước 0076 (`debt_opened_at` NULL), O = B − min(B, W_cũ). W_cũ trừ phần dòng gốc trước trả phòng bằng cách đi ngược chuỗi `related_line_id`, nhưng đệ quy dừng ở độ sâu 50.
  - Sau hơn 50 lần A32 trên cùng một dòng, dòng gốc trước trả phòng nằm ngoài chuỗi. Toàn bộ dòng hiện hành bị tính là phí trong cửa sổ, nên W_cũ ≈ B và O về 0.
  - Từ đó W = B − O = B, và 208 cho void hoặc giảm cả phần đã là nợ.
  - **Tái hiện (S5, dữ liệu giả):**
    - nợ 100.000 từ đảo khoản thu, đưa về dạng trước 0076 như `asPre0076` của test 210;
    - MGR tăng dòng phòng 1.000 đồng mỗi lần. Đến lần 50: B 150.000, O 100.000. **Lần 51: B 151.000, O 0**;
    - lần 52 xong, MGR void dòng phòng: **201**, B về 0, O về 0.
  - Kết quả: nợ 100.000 bị xóa không qua `debt_write_off`, không qua OWN, không qua hạn mức BR-433. Mỗi bước chỉ để lại nhật ký `folio_line.adjusted` bình thường.
- Vì sao quan trọng:
  - Đây đúng là đường "A32 tăng rồi giảm để tha nợ" mà N-7 được đặt ra để chặn (s4-SEC F, D.4), tức là sai tiền và lách kiểm soát của OWN.
  - Phạm vi: chỉ những đơn có nợ trước 0076 đang trong cửa sổ sau trả phòng, và chỉ tới lần ghi nợ kế tiếp (lần đó tạo chu kỳ). Hiện chưa có dữ liệu thật nên mức lộ thực tế thấp. Nhưng D.1 yêu cầu O **đúng** trên dữ liệu trước 0076, và công thức hiện tại sai có thể tái hiện.
  - Chỉ với `61dfdd5` (chưa có 208), lỗi này làm nợ cũ biến khỏi "Cần chú ý" tới khi J15 chạy. Trần xóa nợ thấp hơn, tức sai về phía an toàn. Tác động nhỏ, nên `61dfdd5` vẫn gộp được.
- Đề xuất sửa (làm **cả hai**, a để đúng số, b để phòng thủ nhiều lớp):
  - (a) `windowChargesVnd` an toàn khi lỗi:
    - bỏ giới hạn độ sâu, hoặc giữ giới hạn chống vòng lặp nhưng lá nào có chuỗi **không kết thúc** thì tính đóng góp 0 vào W_cũ (không tính cả dòng);
    - "kết thúc" nghĩa là chạm dòng không phải `post_checkout`, hoặc chạm dòng `post_checkout` gốc có `related_line_id` NULL;
    - thêm test: chuỗi 60 lần A32 trên dữ liệu trước 0076 vẫn cho O = 100.000.
  - (b) Trong `adjust` (208): khi chu kỳ chưa có (`debt_opened_at` NULL) và nợ còn mở, **giữ N-7 cũ**, tức chặn mọi lần giảm cho tới khi `writeDebt` tạo chu kỳ.
    - Như vậy quyền giảm không bao giờ dựa trên công thức suy ngược của dữ liệu cũ;
    - cần xuất cờ "có chu kỳ" qua `OpenDebt` (ARC xác nhận hợp đồng cổng);
    - test: dữ liệu trước 0076, giảm 1 đồng → 409.
- Trạng thái: Open

### FB-R3-SEC-BE-B-02
- Mức độ: **Major**
- Vị trí: `product/services/api/test/integration/s438-r8/r3-folio-lines-208.test.ts` – ca 208-G; `s1-be-b.md` giả định 5.
- Vấn đề:
  - D.3 (c) yêu cầu test **song song** trong PR. 208-G chạy hai lần giảm nối tiếp, mỗi lần lấy etag mới, nên không kiểm được đọc dưới khóa.
  - Fixture đã có `x.interleaved`, giữ khóa folio để ép các request xếp hàng, và `x.race`, đã dùng cho 209-D.
  - SEC đã chạy thử bằng test dò tạm. Kết quả luôn là một `201` và một `412 VERSION_CONFLICT`. O không đổi, không deadlock.
- Vì sao quan trọng: test nối tiếp xanh cả khi về sau ai đó dời phần đọc B/O lên trước `lockStay`, hoặc bỏ kiểm version. Điều kiện gộp D.3 ghi rõ phải là test đua thật.
- Đề xuất sửa: thêm vào PR 208 các ca dùng `x.interleaved` hoặc `x.race`, kiểm cả hai thứ tự:
  - (1) void 70.000 song song với giảm 40.000, cùng If-Match → đúng một `201`, lượt kia `412` hoặc `409`; O = 100.000; B ≥ O;
  - (2) A32 giảm song song với đảo khoản thu;
  - (3) A32 giảm song song với quyết định duyệt `debt_write_off`;
  - đếm deadlock bằng `x.deadlocks()`, phải +0.

  Chấp nhận `412` thay cho `409` của chữ D.3 (c): miễn đúng một lượt bị từ chối và không có gì được ghi.
- Trạng thái: Open

### FB-R3-SEC-BE-B-03
- Mức độ: Minor
- Vị trí: `folio-lines.service.ts` – hai nhánh audit `folio_line.adjusted` (dòng ~592–630, `ad7390c`).
- Vấn đề:
  - (a) `after.openDebtVnd` chỉ chép lại số O **trước** khi ghi, không đo lại sau `syncReductions`. D.4 yêu cầu O trước và sau. Ghi như hiện tại thì nhật ký luôn nói "O không đổi", kể cả khi có lỗi như FB-01.
  - (b) Nhật ký chỉ có `actor_user_id`, không chụp vai lúc làm. D.4 yêu cầu "có vai".
- Vì sao quan trọng: khi điều tra một lần tha nợ, nhật ký phải cho thấy số thật, không phải số mong đợi. Vai có thể đổi sau đó.
- Đề xuất sửa:
  - đo lại O bằng `hooks.openDebt` sau `syncReductions`, vẫn trong cùng giao dịch và cùng khóa, rồi ghi vào `after.openDebtVnd`;
  - nếu O sau < O trước, ném lỗi để rollback và ghi log mức error, không có số tiền của khách. Đây là bất biến BR-525 (ii) kiểm lúc chạy;
  - thêm `actorRole` (`owner` hoặc `manager`) vào `before` và vào allowlist `folio_line`.
- Trạng thái: Open

### FB-R3-SEC-BE-B-04
- Mức độ: Minor
- Vị trí: `rounds/round-03/outputs/BE/s1-be-b.md` mục 1.2 và dòng 32; thông điệp commit `ad7390c`.
- Vấn đề:
  - Báo cáo trỏ tới `reviews/SEC-on-BE-208.md`, còn ORC giao tên `s1-SEC-on-BE-B.md`.
  - Commit `ad7390c` nằm trên `61dfdd5` của cùng nhánh. Nếu gộp kiểu squash hoặc rebase thì SHA đổi.
- Vì sao quan trọng: D.2 gắn chữ ký SEC với SHA. Lệch tên tệp hoặc lệch SHA dễ dẫn tới gộp nhầm bản chưa review.
- Đề xuất sửa:
  - sửa tham chiếu trong báo cáo sang tệp này;
  - khi mở PR 208, ghi trong mô tả PR head SHA đã được SEC review và bản sửa FB-01/FB-02;
  - gộp 208 bằng merge giữ SHA, hoặc báo SEC kiểm lại sau rebase.
- Trạng thái: Open

### FB-R3-SEC-BE-B-05
- Mức độ: Suggestion (chuyển DOM/ARC cân nhắc, không thuộc điều kiện D)
- Vị trí: `folio-lines.service.ts` `adjust` trên folio `settled`.
- Vấn đề:
  - S4 tái hiện được: MGR tăng minibar thêm 1.000.000, rồi void dòng phòng 750.000 → `201`. O không đổi, nên không phải đường tha nợ.
  - Nhưng doanh thu đã chuyển từ nhóm `room` sang `other`. Việc này ảnh hưởng cơ sở hoa hồng CTV/OTA (BR-903), ADR/RevPAR và hóa đơn.
  - Hành vi này đã có cho folio không nợ trước 208; 208 mở thêm cho folio có nợ.
- Vì sao quan trọng: có thể dùng để giảm hoa hồng hoặc làm lệch báo cáo doanh thu sau khi bill đã chốt. Nhật ký có ghi, nhưng không có gì ngăn trước.
- Đề xuất sửa: DOM xem có nên giới hạn A32 trên folio `settled`, ví dụ giảm dòng `room` phải kèm cùng lượng tăng trên cùng nhóm doanh thu, hoặc đưa A32 sau trả phòng có giảm `room` vào báo cáo kiểm soát của OWN.
- Trạng thái: Open

### FB-R3-SEC-BE-B-06
- Mức độ: Suggestion (xác nhận giả định BE số 6)
- Vị trí: `folio-lines.service.ts` N-15; `reversal-debt-g4.test.ts` bước cuối đổi sang 409.
- Vấn đề / ý kiến SEC:
  - N-15 chặn cả chiều **tăng** sau khi hết cửa sổ. Về bảo mật, cách này nhất quán với `lockForPosting`, vốn cũng chặn phí mới sau cửa sổ, và an toàn hơn. SEC đồng ý.
  - Phần nghiệp vụ, tức có cần một đường tăng sau cửa sổ hay không, do ARC/DOM chốt.
- Vì sao quan trọng: tránh để ca test R2 đổi kỳ vọng mà không ai ký.
- Đề xuất sửa: ARC ghi xác nhận vào `s1-contracts` 16.31.1; không cần đổi mã.
- Trạng thái: Open

---

## Điểm làm tốt (giữ lại)
1. Kiểm tra theo số đặt **sau** L1 → L3 và sau kiểm version, **trước** mọi lần ghi. Vai FD bị chặn trước khi chạm tới số nợ nên không suy ra được nợ qua mã lỗi. Thông báo 409 không lộ số tiền.
2. Công thức có chu kỳ (`recorded − (Σ giảm − base)`, kẹp theo B) không phụ thuộc dòng nào bị sửa. Fuzz nhỏ của SEC và các ca đua đều giữ được O không giảm. Trần `applied_cap_vnd` được tôn trọng khi đăng lại FOC.
3. Test chạy trên DB thật với role `ottimo_app`. Có ca nhiều vai (MGR + OWN đều 409). Ca không ghi gì so cả số dòng lẫn version.

---

## Review BE-83 (R3-Q22) + ESC-026 A + R3-Q25 – commit `29ce3d8` (23/10/2026)

- Phạm vi: diff `29ce3d8` trên nhánh `worktree-agent-a4a7a7b47e3d900bf`, gồm:
  - `foc.service`, `approval.service`, `folio.service` (`folioNightBasisVnd`, `reductionUsage`);
  - `stay-waiver-alert.ts`, `attention.service`/`events.service`;
  - migration 0079;
  - test `r3-be83-esc026.test.ts`.
- Đối chiếu: `s1-security-requirements.md` B.0 + B.5. Báo cáo `outputs/BE/s1-be-b.md` mục 8.
- Kiểm đã chạy (Postgres 17 riêng của SEC, đã gỡ; dữ liệu giả):
  - `r3-be83-esc026.test.ts`: **14/14 đạt**;
  - test dò tạm của SEC (Q1, không commit, đã xóa; worktree sạch).

### Kết luận

| Hạng mục | Kết luận SEC |
|---|---|
| **FB-R2-SEC-BE-83 / ESC-026 A – Verified (B.5)?** | **CHƯA.** 1 Blocker: FB-R3-SEC-BE-B-07, MGR tự nâng cơ sở hạn mức để xóa nợ một mình, có tái hiện. Ngoài ra B.0 chưa đủ: commit chưa gộp `main` qua PR và CI. |
| R3-Q25 (xác thực lại khi tự áp xóa nợ) | Đạt về mã và test: thiếu → 422 `secret` `REQUIRED`, không ghi gì. Kiểm mật khẩu chạy trước unit of work, lần sai được đếm (`PasswordReauth`). |
| Ca B.5 #1–#5, #7, #8 | Đạt trên test của PR (BR-525-21…24, 26, 27 (đua ép thứ tự, deadlock +0), BR-433-04/05, E26-1…5, 9; 15 dòng `pendingFix` đã gỡ). |
| Ca B.5 #6 (chu kỳ nợ mới) | Mã cộng **mọi chu kỳ** của folio, chặt hơn chữ B.5 "tính lại từ chu kỳ mới". DOM BR-433 v0.4.0 / oracle BR-525-25 chốt cách này. **SEC chấp nhận**, vì chặt hơn tức an toàn hơn. B.5 #6 được hiểu theo BR-433 v0.4.0. |
| Migration 0079 | Đạt: RLS + FORCE, policy theo `property_id`. Quyền `ottimo_app` chỉ SELECT/INSERT và UPDATE 3 cột, không DELETE. Audit `folio.foc_stay_alerted` chỉ chứa số tiền và số đếm. Mục "Cần chú ý" chỉ OWN thấy (`OWNER_ONLY`, có E26 kiểm). |

### FB-R3-SEC-BE-B-07
- Mức độ: **Blocker** (sai tiền, lách hạn mức BR-433 (a) và lách cả cảnh báo ESC-026 A)
- Vị trí: `folio.service.ts` `folioNightBasisVnd` (cơ sở đọc từ dòng `room` **đang sống**); `foc.service.ts` `request` (`limitBasisVnd`); `stay-waiver-alert.ts` `threshold` (MGR = cùng hàm). Đường mở: A32 tăng giá dòng phòng trên folio `settled` (MGR không bị giới hạn sàn/trần), rồi A32 giảm lại theo 208 (giảm ≤ W).
- Vấn đề, tái hiện Q1 (dữ liệu giả):
  - Ban đầu: nợ 5.000.000, giá đêm 667.000.
  - MGR A32 nâng dòng phòng lên 5.000.000 → `201`. B tăng thêm 4.333.000, nằm trong cửa sổ; O không đổi.
  - MGR xóa nợ 4.000.000, có xác thực lại → **`201 approved eff 4000000`, tự áp, không qua OWN**, vì Σ 4.000.000 ≤ cơ sở "đêm cao nhất" đã bị nâng thành 5.000.000.
  - MGR A32 hạ dòng phòng về 667.000 → `201` (phần giảm 4.333.000 ≤ W = B − O).
  - Kết quả: B = O = 1.000.000. **4.000.000 nợ bị xóa chỉ bởi MGR. `foc_stay_alert` = 0, thông báo OWN = 0**, vì ngưỡng cảnh báo được tính bằng chính cơ sở đã bị nâng lúc áp, và không có đánh giá lại khi cơ sở giảm.
  - Đọc mã, chưa tái hiện: cùng kiểu với (b) trong lúc ở. `nightRateBasis` đọc giá đêm hiện hành; MGR đổi giá đêm qua A31/A32 không bị sàn/trần. Nâng giá đêm → FOC trên khóa khác vượt hạn mức thật → hạ giá đêm lại. FOC trên khóa khác vẫn giữ, và cảnh báo ESC-026 cũng không bật.
- Vì sao quan trọng:
  - BE-83 và ESC-026 A sinh ra để chặn MGR tự xóa hay miễn vượt hạn mức mà OWN không biết. Đây là 1 trong 6 điều kiện phát hành v1.0.
  - Đường này cho MGR xóa gần trọn công nợ một mình. Dấu vết chỉ còn ở nhật ký A32, không có cảnh báo nào.
- Đề xuất sửa (ARC chốt hợp đồng, DOM xác nhận định nghĩa cơ sở):
  1. **Cơ sở hạn mức không lấy từ dòng sửa được sau trả phòng.** Với `debt_write_off` và ngưỡng ESC-026 trên folio `settled`/`closed`: cơ sở = giá đêm cao nhất **lúc B18**, chụp khi `settle` (cột mới trên `folio`, hoặc tính từ các dòng `room`/`late_fee_as_night` có `post_checkout = false`, kể cả dòng đã bị đảo sau đó). Lấy **min(cơ sở lúc B18, cơ sở hiện hành)** để A32 giảm không làm hạn mức lớn lên.
  2. **Trong lúc ở (b):** cơ sở của FOC/giảm giá = giá đêm **trước** mọi lần đổi giá trong cùng ca, hoặc min(giá đặt phòng, giá hiện hành). Hoặc: một lần đổi giá đêm vượt +X% do MGR làm thì phải chờ OWN, hay ít nhất báo OWN. DOM chọn.
  3. Khi áp xong, ngưỡng ESC-026 dùng cùng cơ sở đã sửa ở (1)/(2).
  4. Test bắt buộc trong PR:
     - Q1 như trên → lần xóa nợ 4.000.000 phải `pending` OWN, hoặc nếu tự áp thì phải có thông báo `foc_stay_total_exceeded`;
     - biến thể (b): nâng giá đêm rồi FOC trên khóa khác → `pending`;
     - biến thể A32 nâng `late_fee_as_night`.
- Trạng thái: Open

### FB-R3-SEC-BE-B-08
- Mức độ: Suggestion
- Vị trí: `folio.controller.ts` `requestFoc` (R3-Q25); `s1-security-requirements.md` A (SR-AUTH-06).
- Vấn đề: xác thực lại khi tự áp xóa nợ hiện chỉ dùng mật khẩu. Khi US-143 (TOTP cho `owner`/`manager`) vào, thao tác tự áp tiền vượt mức FD nên đòi thêm TOTP như đăng nhập, để mật khẩu lộ không đủ để xóa nợ.
- Đề xuất: ghi vào checklist US-143 (A.x) để `PasswordReauth` cho mục đích `foc`/`debt_write_off` dùng chung bước TOTP khi người dùng đã bật 2FA.
- Trạng thái: Open

### Ca QA phải đưa vào fuzz R3-Q30
1. B.5 #1–#4: chuỗi MGR 450.000 lặp lại; biên Σ = cơ sở / +1 đồng; từ chối, hủy `debt_cleared` không tính, đang chờ có tính; hai yêu cầu song song vượt tổng → đúng một tự áp.
2. **Nâng cơ sở (FB-07):** xen ngẫu nhiên A32 tăng/giảm dòng `room` và `late_fee_as_night` giữa các lần xóa nợ/FOC của MGR. Bất biến: tổng xóa nợ đang áp của các yêu cầu do vai dưới OWN duyệt ≤ cơ sở lúc B18, **trừ khi** có thông báo `foc_stay_total_exceeded` tới OWN.
3. **Void dòng mang xóa nợ rồi xóa lại:** A32 void (khoản cửa sổ) dòng có FOC `debt_write_off`, rồi MGR xóa nợ lần nữa. Bất biến: Σ đang áp do vai dưới OWN duyệt ≤ cơ sở tại mọi thời điểm; O không giảm qua A32 (BR-525 (ii)).
4. Bất biến cảnh báo: Σ lượt (vai dưới OWN) > ngưỡng ⇒ có ít nhất một thông báo OWN và đúng một mục "Cần chú ý" cho lượt đó.
5. Giữ các ca 208 đã có (A32 tăng lặp rồi giảm, biên W, đua) trên cùng bản.

### Điều kiện để SEC ghi Verified FB-R2-SEC-BE-83 + ESC-026 A
1. Sửa FB-R3-SEC-BE-B-07, có test Q1 và các biến thể trong PR. SEC review lại diff.
2. Gộp `main` qua PR, CI xanh, 0 `retry #` (B.0 1–2).
3. SEC chạy lại các ca bắt buộc trên worktree sạch ở commit đã gộp, DB mới migrate từ đầu (B.0 3). Ghi Verified ở `SEC-sprint1.md` như B.0 6.
4. Fuzz R3-Q30 có các ca 1–4 ở trên và chạy xanh trên bản có 208 + BE-83 (D.6).

### Điểm làm tốt
1. Σ được đọc dưới L1 → L3 ngay trong `request`. Ca đua BR-525-27 ép thứ tự sau khóa folio, chạy hai thứ tự, deadlock +0.
2. Σ xóa nợ tính theo dòng FOC **đang sống** và gồm cả yêu cầu đang chờ. Từ chối hay hủy `debt_cleared` không cộng, và đăng lại do BUG-R2-207 không bị tính hai lần.
3. Bảng `foc_stay_alert` có RLS FORCE và quyền cột tối thiểu. Mục "Cần chú ý" chỉ OWN thấy. Audit cảnh báo không có dữ liệu khách.

---

## Review lại BE-83 lượt 2 – head `41c49d7` (Phản hồi & sửa, 23/10/2026)

- Phạm vi:
  - diff `5834c6a..41c49d7` trong `product/services/api/src`, gồm:
    - `folio.service` (`limitBasisVnd`, `waiverLimitInput`, chụp cơ sở trong `settle`);
    - `foc.service`, `stay-support`, `stay-waiver-alert`;
    - các đường giá của `reservations` (`insertNights`, `lease-nights`, re-price, kế hoạch dời/đổi);
    - migration 0080;
  - test `r3-bb07-limit-basis`, `money-limit-basis-architecture`;
  - `responses/s1-BE-B.md` mục "Lượt 2".
- Cách chạy kiểm:
  - worktree tách riêng của SEC ở đúng `41c49d7`, Postgres 17 mới, migrate từ đầu, dữ liệu giả;
  - không sửa nhánh `worktree-agent-a4a7a7b47e3d900bf`, vì worktree đó nay đang dùng cho nhánh khác.

### Kiểm đã chạy
1. `tsc --noEmit`: đạt.
2. **Toàn bộ api `vitest run` ở `41c49d7`: 109 tệp đạt (1 bỏ qua), 3.025 test đạt (2 bỏ qua), 0 lỗi.**
3. `r3-bb07-limit-basis` (BB07-1…7, S1-11, 0080 guards), `r3-be83-esc026`, `money-limit-basis-architecture`: 30/30 đạt.
4. Chạy lại ca dò Q1 của SEC, thêm chuỗi nâng giá:
   - MGR A32 nâng dòng phòng lần lượt 2.000.000 → 5.000.000 → 9.000.000, tất cả `201`;
   - mọi dòng thay vẫn mang `limit_ref_vnd` = 667.000; `limit_basis_checkout_vnd` = 667.000;
   - MGR xóa nợ 1.000.000 trên dòng nợ → **`pending`** OWN;
   - MGR xóa nợ 1.000.000 trên chính dòng phòng đã nâng → **`pending`**;
   - MGR xóa nợ 600.000 → **`pending`**;
   - O giữ 5.000.000. **Đường của FB-07 đã đóng.**

### Đọc mã
- **Một cổng đọc cơ sở:**
  - giá bảo vệ của đêm = `LEAST(giá dòng, limit_ref_vnd)`, rồi lấy min với số chụp lúc B18;
  - `nightRateBasis` và `folioNightBasisVnd` đã bị xóa;
  - test kiến trúc khóa: ai được ghi `reference_rate_vnd` / `limit_basis_checkout_vnd`, và mọi `approvals.submit` loại `foc`/`special_discount` phải đi qua `waiverLimitInput`.
- **A31 `setNightRate` không ghi giá tham chiếu.** Đêm gõ tay giữ giá tham chiếu cũ. Sửa tay chỉ làm cơ sở **giảm** (BB07-6), không bao giờ làm tăng.
- **CHECK `folio_line_limit_ref_required_check`:** dòng đêm không có giá tham chiếu thì không ghi được, tức hỏng thì đóng (fail-closed).
- **Migration 0080:**
  - backfill chạy lại được (`WHERE … IS NULL`); tắt RLS chỉ trong lúc backfill, sau đó bật lại `ENABLE` + `FORCE` (theo mẫu 0016/0055);
  - `foc_stay_alert` có FK tới `reservation`; `GRANT UPDATE (details)` trên `attention_event` vẫn chỉ cho ghi khóa `params` có trong allowlist.
  - Folio đã settle trước 0080 không có số chụp, nên rơi về cơ sở tính từ giá tham chiếu backfill (= giá hiện hành lúc migrate). Chấp nhận được, vì staging bắt đầu rỗng (OPS C2) và chưa có dữ liệu thật.
- **CHECK kind thông báo:** 0079 (2FA) và 0081 (BE-C) trên `main` không viết lại `staff_notification_kind_check`. 0080 là bản viết lại duy nhất (hợp các kind + `foc_stay_total_exceeded`), nên không làm mất kind của nhánh khác.

### Trạng thái thẻ (người review xác nhận)

| ID | Mức | Trạng thái BE | SEC xác nhận |
|---|---|---|---|
| FB-R3-SEC-BE-B-07 | Blocker | Done | **Verified (review)** ở `41c49d7`: Q1 và chuỗi nâng giá → `pending`; BB07-1…7 đạt. |
| FB-R3-SEC-BE-B-08 | Suggestion | Accepted → checklist US-143 | Đồng ý. Còn mở, theo US-143, không chặn. |
| FB-R3-SEC-BE-B-09 (mới) | Minor | – | Open, xem dưới. |

### FB-R3-SEC-BE-B-09
- Mức độ: Minor (rủi ro còn lại, không chặn gộp)
- Vị trí: BR-433 (d) – đường giá **hợp lệ** của hệ thống trong lúc ở: B14 đổi căn, B7 gia hạn với giá gõ trong khung sàn–trần (`insertNights` ghi giá tham chiếu = giá đêm). Áp lên `stay-waiver-alert.ts` (ngưỡng MGR lấy lúc áp).
- Vấn đề:
  - Trong lúc ở, MGR vẫn nâng được cơ sở bằng một thao tác hệ thống hợp lệ. Ví dụ đổi khách sang căn đắt hơn (BB07-5 cho phép đúng như BR-433 (d)), hoặc thêm một đêm giá gõ sát trần. Sau đó MGR tự áp FOC lớn trên khóa khác, rồi đổi căn ngược lại hoặc rút đêm. FOC đã áp vẫn còn.
  - Ngưỡng ESC-026 tính tại lúc áp nên cũng không bật.
  - Trần là giá căn đắt nhất hoặc trần sàn–trần, không còn vô hạn như FB-07. Mọi bước đều để lại vết vận hành (đổi căn, sửa ngày, nhật ký).
- Vì sao quan trọng: đây là cách lách hạn mức nhỏ hơn FB-07, nhưng vẫn là MGR tự áp vượt "giá một đêm thật" mà OWN không được báo.
- Đề xuất sửa (DOM chọn, Sprint 2):
  - khi giá tham chiếu của một đêm **giảm** (đổi căn ngược, rút đêm) mà khóa đó hoặc lượt ở đang có FOC do vai dưới OWN áp vượt cơ sở mới, gửi thông báo OWN (đánh giá lại ESC-026 khi cơ sở giảm);
  - hoặc dùng cơ sở = min(giá tham chiếu lúc nhận phòng, hiện hành) cho FOC trên khóa không phải `room`;
  - QA đưa vào fuzz (mục dưới).
- Trạng thái: Open

### Kết luận lượt 2

| Hạng mục | Kết luận SEC |
|---|---|
| **BE-83 (FB-R2-SEC-BE-83) + ESC-026 A theo B.5** | **Đạt review ở `41c49d7`.** Không còn Blocker/Major của SEC. Ca B.5 #1–#8 đạt (B.5 #6 hiểu theo BR-433 v0.4.0, cộng mọi chu kỳ). R3-Q25 đạt. |
| **Gộp** | **Gộp được** sau khi ARC làm thao tác S1-14 (nối lên `main` đã có 0079/0081). SEC chỉ cần xác nhận lại khi diff của bước nối chỉ chạm journal/snapshot migration. Nếu có đổi mã, SEC review phần thêm. |
| **Verified chính thức (B.0)** | **Chưa ghi.** SEC ghi Verified ở `SEC-sprint1.md` khi đủ: (1) commit đã gộp `main` qua PR, CI xanh, 0 `retry #`; (2) SEC chạy lại các tệp `r3-be83-esc026`, `r3-bb07-limit-basis`, `money-limit-basis-architecture` trên worktree sạch ở commit gộp, DB mới; (3) QA đã đưa các ca fuzz dưới đây vào R3-Q30 và chạy xanh (D.6). |

### Ca QA đưa vào fuzz R3-Q30 (cập nhật)
1. B.5 #1–#4 (như mục trước).
2. **I16 / FB-07:** xen ngẫu nhiên A31/A32 tăng hoặc giảm dòng `room` và `late_fee_as_night`, trước và sau B18, giữa các lần FOC/xóa nợ của MGR. Bất biến: cơ sở hạn mức ≤ min(giá tham chiếu, số chụp lúc B18); Σ đang áp do vai dưới OWN duyệt ≤ cơ sở, trừ khi OWN đã nhận `foc_stay_total_exceeded`.
3. **FB-09:** B14 đổi căn lên rồi xuống, và B7 thêm rồi rút đêm giá gõ sát trần, xen FOC trên khóa khác. Ghi lại Σ so với cơ sở **sau** khi hoàn tác. Hiện đây là ca quan sát: báo số lần vượt, không fail, cho tới khi DOM chốt cách xử lý.
4. Void dòng mang xóa nợ rồi xóa lại; bất biến O không giảm qua A32 (BR-525 (ii)).
5. Bất biến cảnh báo: Σ lượt ở > ngưỡng ⇒ có ít nhất một thông báo OWN và đúng một mục "Cần chú ý" đang mở (S1-11).
