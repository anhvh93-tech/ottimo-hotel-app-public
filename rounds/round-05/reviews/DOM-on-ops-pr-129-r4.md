# DOM đọc lại – PR #129 r4, K13 câu (2), (3) và giả định (c), (e)

- Người review: DOM | Round 5 – bước Review (đọc lại sau sửa) | Ngày: 07/11/2026
- Đối tượng: **PR #129** (OPS, runbook v1.0.5 r4), nhánh `r5-ops-runbook-r3` @ **`c394ea45`**. Lần trước DOM đọc @ `3861ccc4` (`DOM-on-pr-99-delta-and-129.md`, thẻ 129-01, 129-02).
  - Phần chênh của runbook `3861ccc4..c394ea45`:
    - `baa32dd5`: K13 r4;
    - `246a6db2`: gộp `main`;
    - `c394ea45`: một dòng chữ ngoài khối ghim ("SEC chọn cách 1 hay cách 2").
  - DOM tự trích hai khối từ `c394ea45` bằng lệnh `awk` của runbook:
    - câu `v530-check`: SHA-256 `c13c4d68…0d71`, 106 dòng, 7 245 byte;
    - khối `v530-run`: `4f89c218…32ab`.

    Hai số trùng số OPS ghi ở bảng 0.1.
- Đối chiếu:
  - BR-006, BR-212, BR-302, BR-903 (1), (2), (5);
  - `rules-v1.0.5.md` 7.3 và 14.2 (tỷ lệ khi đơn không có tỷ lệ chụp).
- Mã `main` @ `6dbc9c82`. Từ `c394ea45` tới đây, `main` không đổi gì ở phần hoa hồng.
  - `folio.service.ts`: `syncCommission`, `voidCommissions`;
  - `commission-rate.ts` (`commissionPctFor`: `agent` → `collaborator`);
  - `pricing.service.ts` (`PricingService.snapshot`), `sales-port.ts`, `sales-port.adapter.ts` (báo giá → giữ chỗ);
  - `quotes.service.ts` (`applyExtension`), `reservations.service.ts` (`createReservation`, `createHold`, đơn con gia hạn, phí hủy, phí không đến);
  - `checkout.service.ts` (`deposit_forfeit`).
- Mô tả PR #131 (BE-H, đang review): ghim tỷ lệ của dòng hoa hồng đầu tiên.
- Không ghi tỷ lệ, số tiền, thưởng, mã đơn hay số đếm nào. DOM không xem giá trị.

## 1. Kết luận

- **PR #129 @ `c394ea45`: ĐẠT về nghiệp vụ cho K13.**
  - Câu (2) và (3) đúng định nghĩa 129-01, 129-02.
  - **Điều kiện 2 của SEC 2.2 đạt**, chỉ cho câu **cách 1** ở SHA `c13c4d68…0d71`. SEC chọn cách 2, hoặc câu đổi dù một byte: DOM đọc lại phần đổi.
- Thẻ:
  - FB-R5-DOM-OPS-129-01 (Major): **Closed**;
  - FB-R5-DOM-OPS-129-02 (Minor): **Closed**;
  - mới: FB-R5-DOM-OPS-129-03 (Suggestion). Thẻ này không chặn SEC ghim, không đòi đổi câu.
- Giả định (c): **chấp nhận** (mục 4).
- Giả định (e): **chấp nhận** (mục 5).
- Không thuộc DOM lần này: P2c bước 2, README 11.1, CODEOWNERS. Về nghiệp vụ, DOM đồng ý repo chỉ ghi `= 0` hay `> 0` cho 4 dòng `closer_bookings_*` (SEC 129-01), còn số chính xác ORC báo INV trong chat.

## 2. Câu (2), đối chiếu 129-01

| Ý của 129-01 | Câu r4 | DOM |
|---|---|---|
| Đơn chính ngắn ngày | `stay_type = 'short'`, `parent_reservation_id IS NULL` | Đúng. Đơn con gia hạn tạo không có `closer_user_id`, nên không có dòng hoa hồng riêng. Lọc đơn chính không làm mất dòng nào |
| Dòng hoa hồng của đơn, chưa `void` | `reservation_id` có, `lease_contract_id` trống, `status <> 'void'` | Đúng. `syncCommission` là chỗ duy nhất ghi `commission` |
| Bỏ điều kiện vai người chốt | Không còn | Đúng |
| Tỷ lệ chụp từ báo giá: ngày tạo báo giá | `quote.created_at` qua `quote_id` | Đúng. Gia hạn báo giá (`applyExtension`) chỉ dời hạn, không tính lại giá. Vì vậy ngày tạo báo giá vẫn là ngày chụp, kể cả khi báo giá được gia hạn quá 3 ngày (BR-304) |
| Ngày chụp từ 01/11 | `taken_on >= 2026-11-01`, theo giờ cơ sở | Đúng |
| So với tỷ lệ của **đúng loại người hưởng** trong hàng mới áp cho ngày chụp. Ngày chụp trước hàng mới đầu tiên thì so với hàng đầu. Chưa có hàng mới thì mọi dòng đều đếm | Câu con dùng `GREATEST(taken_on, min(effective_from))`, `value -> sub_key` | Đúng nghĩa. Bảng nội bộ áp từ 01/11. Hàng mới đầu tiên chính là bảng đó nhập muộn, vì Desk không cho lùi ngày hiệu lực (7.3). Cách đổi `agent` → `collaborator`, `staff` → `staff` khớp `commissionPctFor` |
| Giữ nguyên tỷ lệ cho một loại người hưởng thì không đếm | `IS DISTINCT FROM` | Đúng |
| Tách đã đạt / còn dự kiến | Theo trạng thái của **dòng lệch** | Đúng BR-212. Xem chú thích `paid` dưới bảng |
| Kiểm `b ≤ a`, `c ≤ a`, `a ≤ b + c` (thay `m ≤ n`) | Bảng "Đúng là" | Đúng nghĩa, xem giải thích dưới bảng |

**Chú thích `paid`:** dòng đạt trong tháng 11 chỉ thành `payable` ngày 01/12. Vì vậy lần chạy trước 01/12 không có dòng `paid` nào chụp từ 01/11. Nếu chạy muộn mà có, chủ đầu tư bù hoặc trừ ở kỳ chi sau, như BR-212 cho bản ghi chỉnh sau khi đã chi. Không cần đổi chữ.

**Phép kiểm `b ≤ a`, `c ≤ a`, `a ≤ b + c`:**

- `b`, `c` là tập con của `a`.
- Mỗi đơn trong `a` có ít nhất một dòng ở một trong 4 trạng thái chi. Vì vậy `a ≤ b + c` chỉ sai khi có trạng thái lạ, tức dòng mà chủ đầu tư không biết chi kỳ nào. Gặp thì dừng là đúng.
- Một đơn có ở cả `b` lẫn `c` thì `b + c > a`, vẫn hợp lệ.

## 3. Câu (3), đối chiếu 129-02

| Ý của 129-02 | Câu r4 | DOM |
|---|---|---|
| Đơn chính ngắn ngày, nay `cancelled` hoặc `no_show` | Có | Đúng |
| Người chốt theo đúng luật `syncCommission` | Vai `sales_staff` hoặc `collaborator` chưa thu hồi, tài khoản `active` | Đúng chữ DOM |
| Ngày chụp từ 01/11, không có mốc trên | Có | Đúng. Không có tỷ lệ chụp thì dùng ngày tạo đơn. Xem 129-03 ý 3 |
| Có dòng phí giữ lại còn sống | `cancellation_fee` hoặc `no_show_fee`; `posted`; không phải dòng đảo; chưa bị đảo; số tiền > 0 | Đúng. Đây đúng là hai loại dòng mà đường hủy ghi (`feeCategory: 'cancellation_fee'`, gồm phí OTA) và đường không đến ghi (`'no_show_fee'`). Dòng `pending_approval` chưa phải tiền giữ lại; khi đã duyệt thì lần 2 sẽ thấy |
| Đơn hủy không giữ đồng nào thì không đếm | Có | Đúng |
| "Cách đọc" | Đúng nguyên chữ DOM, gồm câu về ESC-051 câu 1 | Đúng |

## 4. Giả định (c): chấp nhận

Đơn không có tỷ lệ chụp thì ngày chụp = ngày tạo dòng hoa hồng **đang sống**, không phải ngày tạo đơn.

**Vì sao chữ cũ của DOM sai.** Chữ "ngày tạo đơn" ở 129-01 dựa trên giả định 2 của DOM lần trước: "form đặt phòng tự chụp tỷ lệ". Trên `main` giả định đó **sai**:
- `PricingService.snapshot` không ghi `commissionRatePct`. `sales-port.ts` ghi rõ: tỷ lệ trống thì dùng tỷ lệ đang hiệu lực (đơn đặt thẳng).
- Chỉ đường báo giá → giữ chỗ (`sales-port.adapter.ts`) mang `quote.commissionRatePct`.
- Nhánh "tỷ lệ ở gốc bản chép" của câu hiện chưa có đường nào ghi. Để lại vô hại: nếu sau này đường tạo đơn chụp tỷ lệ ở gốc, thì ngày tạo đơn là đúng.

**Luật DOM cho đơn không có tỷ lệ chụp:** 7.3 ("tỷ lệ hiệu lực ngày đồng bộ") và 14.2 ("lần đầu tạo bản ghi thì chụp tỷ lệ đó vào đơn; lần sau chỉ đổi cơ sở"). Vậy mốc nghiệp vụ là **ngày Desk tạo dòng hoa hồng đầu tiên**, không phải ngày tạo đơn.
- Ví dụ của OPS: giữ chỗ tạo 31/10, xác nhận 02/11. Ví dụ đúng thực tế: sale chốt lúc khách xác nhận. Dòng mang tỷ lệ ngày 02/11, ngày đó bảng nội bộ 01/11 đã áp, nên phải đếm.
- Đếm theo ngày tạo đơn thì bỏ sót đơn này.

**Câu OPS dùng ngày tạo dòng đang sống:**
- Trên `main`: `syncCommission` hủy dòng `projected` và tạo dòng mới khi đổi người chốt, cơ sở hay tỷ lệ, lấy tỷ lệ của hôm đó. Ngày tạo dòng sống đúng là ngày lấy tỷ lệ đang nằm trên dòng.
- Có #131 (tỷ lệ ghim theo dòng đầu tiên cùng loại người hưởng): ngày dòng sống ≥ ngày dòng đầu, nên câu chỉ có thể đếm thêm.

**Hướng lệch: chỉ đếm thừa, DOM đã kiểm.**
- Ngày dòng sống luôn ≥ ngày tạo đơn.
- Trước 01/12 dự kiến chỉ có một hàng mới. Khi đó mọi đơn đếm được theo ngày tạo đơn đều có trong câu OPS.
- Ca thừa duy nhất:
  - đơn không qua báo giá, có dòng hoa hồng đầu tạo trước 01/11;
  - dòng đó bị tạo lại sau 01/11 (gia hạn, đổi giá đêm, đổi căn, đổi người chốt) mà vẫn mang tỷ lệ cũ.

  Theo 14.2, đơn này giữ tỷ lệ cũ, không chỉnh. Ca này ít, và "thừa còn hơn thiếu" (129-01). Chữ cho chủ đầu tư ở thẻ 129-03.

## 5. Giả định (e): chấp nhận

Không đếm `deposit_forfeit`.
- Trên `main`, chỉ một chỗ ghi `deposit_forfeit`: B18 (`checkout.service.ts`), khi khách tự để lại tiền trả thừa (`overpayment_retained`, nhóm doanh thu `other`).
  - Đơn lúc đó là `checked_out`, không bao giờ `cancelled` hay `no_show`.
  - Vì vậy có thêm loại này vào câu (3) cũng không đổi số.
- Về luật, BR-903:
  - (1) cơ sở là tiền phòng + phụ thu người, không gồm dịch vụ, phạt;
  - (2) đơn hủy hoặc không đến thì cơ sở là **phí hủy, phí không đến**.

  Tiền khách tặng lúc trả phòng không phải tiền bán phòng, cũng không phải phí giữ lại, nên không có hoa hồng.
- Nếu sau này có đường ghi tiền cọc giữ lại khi hủy hoặc không đến bằng `deposit_forfeit` thay cho hai loại trên, BE/ARC báo DOM. Khi đó câu (3) thêm loại đó và SEC ghim lại. Hiện không có đường như vậy.

## 6. Thẻ

### FB-R5-DOM-OPS-129-01
- Mức độ: Major
- Trạng thái: **Closed** (DOM kiểm @ `c394ea45`, câu `c13c4d68…0d71`).
- Ghi chú: câu (2) đếm theo dòng hoa hồng chưa `void` và ngày chụp tỷ lệ, so tỷ lệ trong câu (cách 1), có tách đã đạt / dự kiến. Mốc ngày khi không có tỷ lệ chụp lệch chữ DOM, nhưng theo hướng đúng luật 7.3, 14.2 (mục 4).

### FB-R5-DOM-OPS-129-02
- Mức độ: Minor
- Trạng thái: **Closed** (DOM kiểm @ `c394ea45`).
- Ghi chú: câu (3) mới và "Cách đọc" đúng BR-903 (2); bỏ `m ≤ n`.

### FB-R5-DOM-OPS-129-03
- Mức độ: Suggestion. Không chặn Release, không chặn SEC ghim. Ý (a) nằm ngoài khối ghim.
- Vị trí: `rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md`:
  - K13, mục **Cách đọc**, gạch `closer_bookings_old_rate > 0`;
  - mục 8, giả định (c), câu đầu;
  - câu `v530-check` phần (2) và (3), nhánh `ELSE` của ngày chụp.
- Vấn đề:
  1. Ca đếm thừa ở mục 4. Chủ đầu tư nhận n trong chat, mở màn Hoa hồng mà chỉ thấy ít hơn n đơn cần chỉnh thì sẽ không hiểu vì sao.
  2. Câu đầu của giả định (c) vẫn ghi "hoặc lúc tạo đơn nếu không qua báo giá", trái với ý thêm ngay dưới nó.
  3. Câu (3) dùng ngày tạo đơn cho đơn không có tỷ lệ chụp. Ca bị sót:
     - đơn giữ chỗ không từ báo giá, tạo 30–31/10, xác nhận từ 01/11 (giữ chỗ tối đa 48 giờ, BR-302);
     - sau đó đơn hủy hoặc không đến mà OTTIMO giữ tiền.

     Cửa sổ này đã đóng, nên rất ít đơn.
- Vì sao quan trọng: chủ đầu tư phải tin con số. Câu (2) và (3) nên dùng cùng một mốc ngày.
- Đề xuất sửa:
  - **(a)** Làm ở lần OPS sửa runbook kế tiếp, không cần lượt riêng, không đụng khối ghim:
    - "Cách đọc", sau câu trích cho n, thêm:
      > Số này có thể gồm vài đơn không qua báo giá, chốt trước 01/11 rồi sửa sau 01/11 (gia hạn, đổi giá, đổi căn). Các đơn đó giữ tỷ lệ cũ, không chỉnh.
    - Giả định (c), câu đầu, thay ngoặc bằng:
      > (lúc báo giá; không qua báo giá thì lúc Desk tạo dòng hoa hồng)

      Và "DOM xác nhận" thành "DOM xác nhận 07/11 (`DOM-on-ops-pr-129-r4.md`)".
  - **(b)** **Chỉ khi** câu `v530-check` phải đổi vì lý do khác (SEC chọn cách 2; bỏ dòng (3) khi phần H2 trên số giữ lại vào bản):
    - nhánh không có tỷ lệ chụp dùng ngày tạo dòng `commission` **đầu tiên** của đơn, cùng `payee_type`, mọi trạng thái, kể cả `void`. Đây đúng luật 14.2 và đúng cách #131 ghim;
    - áp ở cả (2) và (3). Ở (3), đơn không có dòng nào thì vẫn dùng ngày tạo đơn.

    Không đổi câu chỉ vì ý này.
- Trạng thái: Open (OPS tự cân nhắc).

## 7. Ghi chú (không phải thẻ cho OPS)

- **Ca ngược chiều, chuyển sang lượt DOM review #131:**
  - Ca: trên v1.0.4 và `main`, đơn không qua báo giá có dòng đầu trước 01/11. Nếu đơn được đồng bộ lại **sau** khi chủ đầu tư nhập bảng mới, dòng mới mang tỷ lệ mới.
  - Luật 14.2 thì giữ tỷ lệ của dòng đầu.
  - K13 không đếm ca này, vì nó nằm ngoài định nghĩa "tỷ lệ cũ".
  - Theo mô tả #131, lần đồng bộ kế tiếp sau #131 ghim lại tỷ lệ của dòng đầu (đọc mọi trạng thái).
  - DOM xem ca này khi review #131, ORC đã giao. Không đổi K13.
- Bộ ca chạy thử của OPS dùng dữ liệu giả, `test_rate_*`. Bản r4 đã bỏ số đếm của lượt chạy r3 khỏi runbook. Đúng ý SEC 129-01.

## 8. Giả định

1. Trước 01/12 chỉ có một hàng `short_stay_commission_pct` mới (bảng 01/11). Nếu có thêm hàng, câu so với hàng áp cho ngày dòng sống, đúng cách Desk lấy tỷ lệ trên `main`.
2. #131 giữ thứ tự đọc tỷ lệ như mô tả PR: tỷ lệ chụp của đơn → dòng đầu cùng loại người hưởng → bảng hôm nay. Nếu #131 đổi thứ tự này, DOM đọc lại (c).
3. Trên `main` không có đường nào ghi `commissionRatePct` ở gốc `pricing_snapshot`. DOM đã tìm bằng `git grep` và không thấy.
4. Không ESC mới. Đây là định nghĩa đếm theo BR-006, BR-903 và rules 7.3, 14.2 đã có. ESC-051 câu 1 vẫn chờ chủ đầu tư như cũ (tạm áp A).

## 9. Điểm làm tốt

- OPS đọc mã và thấy giả định 2 của DOM sai, rồi chọn hướng chỉ đếm thừa, có ví dụ cụ thể.
- Bộ ca chạy thử phủ đủ từng ca DOM nêu: báo giá trước 01/11, giữ chỗ qua đêm 31/10, đơn con, dài hạn, dòng `void`, một loại người hưởng giữ tỷ lệ, phí đã đảo hoặc chờ duyệt.
- Phép kiểm `b ≤ a`, `c ≤ a`, `a ≤ b + c` vừa thay `m ≤ n`, vừa chặn trạng thái lạ.

## 10. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | DOM – đọc lại PR #129 r4 @ c394ea45, K13: ĐẠT nghiệp vụ; điều kiện 2 của SEC 2.2 đạt cho câu cách 1 v530-check c13c4d68…0d71 (khối v530-run 4f89c218…32ab), câu đổi hoặc SEC chọn cách 2 thì DOM đọc lại. FB-R5-DOM-OPS-129-01, 129-02 Closed. (2) đếm đơn chính ngắn ngày có dòng hoa hồng chưa void, tỷ lệ chụp từ 01/11 khác tỷ lệ cùng loại người hưởng trong hàng mới, tách đã đạt (earned, payable, paid) với dự kiến (projected), kiểm b ≤ a, c ≤ a, a ≤ b + c; (3) đơn hủy/không đến do sale/CTV chốt từ 01/11 có phí hủy/phí không đến còn sống. Giả định (c) chấp nhận: không có tỷ lệ chụp thì ngày chụp = ngày tạo dòng hoa hồng đang sống (đơn không qua báo giá không chụp tỷ lệ; rules 7.3, 14.2), chỉ có thể đếm thừa. Giả định (e) chấp nhận: không đếm deposit_forfeit (chỉ B18 ghi, tiền khách để lại, không phải phí giữ lại; BR-903 (1), (2)). FB-R5-DOM-OPS-129-03 Suggestion: chữ Cách đọc ngoài khối ghim; mốc dòng hoa hồng đầu tiên chỉ khi câu đổi vì lý do khác. Ca ngược chiều (đơn chốt trước 01/11 bị đồng bộ sang tỷ lệ mới) xem ở review #131. Không ghi tỷ lệ, số tiền hay số đếm | DOM | rounds/round-05/reviews/DOM-on-ops-pr-129-r4.md |`
