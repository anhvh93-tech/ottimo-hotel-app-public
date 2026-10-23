# SEC review – BE-B lượt kiểm tiền R3 Sprint 1 (210 + 209, phần folio-lines của 208)

- Người review: SEC | Ngày: 23/10/2026 | Round 3 Sprint 1 – Bước Review
- Nhánh: `worktree-agent-a4a7a7b47e3d900bf` (chưa push). Commit được review:
  - `61dfdd5` – BUG-R2-210 + BUG-R2-209 (`writeDebt`, `cycleOpenDebtVnd`, J15, "Cần chú ý");
  - **`ad7390c` – BUG-R2-208 phần `folio-lines` + N-15 (head SHA được review)**. `d94e5e9` phía trên chỉ thêm `rounds/round-03/outputs/BE/s1-be-b.md`, không đổi mã.
- Căn cứ: `outputs/SEC/s1-security-requirements.md` mục D; `round-02/reviews/s4-SEC.md` mục F; báo cáo `outputs/BE/s1-be-b.md`.
- Tên tệp: SEC D.2 ghi `SEC-on-BE-208.md`; ORC giao tên `s1-SEC-on-BE-B.md`. Tệp này thay cho cả hai.
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả của fixture. Không có số tài khoản, bí mật hay dữ liệu thật trong tệp.

## Kết luận

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
