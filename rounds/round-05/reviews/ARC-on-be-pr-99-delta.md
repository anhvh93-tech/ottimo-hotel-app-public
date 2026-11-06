# ARC review phần chênh PR #99 (BE-A2 PR-A1b, V5-15 trả phòng quá ngày đi) – từ `ba99bdb8` đến `92d16358`

- Round 5 (v1.0.5), bước **Review** (đọc lại sau Phản hồi & sửa). Người review: ARC. Ngày 07/11/2026.
- PR: nhánh `r5-a1b`, HEAD **`92d16358`**. Bản trước: `ARC-on-be-pr-106-99-checkout.md`, @ `ba99bdb8`, ĐẠT CÓ ĐIỀU KIỆN.
- Phần chênh gồm hai commit mã và bốn lần gộp `main`:
  - `6d8456a5`: DOM PR99-01, mốc hoa hồng = `folio.settled_at`, kèm 3 ca test;
  - `9bbd15e9`: DOM PR99-02, A2-01, A2-02, cùng ca 2 và ca 4 của ARC 3.1;
  - các merge `63492b7d`, `068b5a05`, `6abefc9f`, `92d16358`.

**Đã đọc:**
- `git show` hai commit mã;
- diff toàn PR so với gốc gộp `cd4b4c1f`: 21 tệp, +1966/−58;
- `folio.service.ts` (`tryEarnCommissions`, `settle`);
- `checkout.service.ts` (`ResolvedCheckoutAt`, `readInput`, đoạn đọc lại dưới khóa, đoạn ghi trạng thái);
- `shared/problem.ts` (`headers`);
- `fridge.ts`, `minibar.service.ts`, `minibar-checkout.port.ts`;
- `reservations/public/stay-departure.ts`, `read-port.ts`, `sales-port.ts`, `reservations.service.ts`;
- `audit-log.controller.ts`.

**Đã chạy:**
- **Môi trường:** worktree riêng, `pnpm install --offline`. Postgres 17 dùng một lần, cổng `127.0.0.1` riêng; vai tạo bằng `02-roles.sh` với mật khẩu CI có sẵn trong `ci.yml`.
- **Kết quả:**
  - `tsc --noEmit` sạch;
  - 3 tệp test V5-15 (`v105-commission-anchor`, `v105-overdue-checkout`, `v105-overdue-checkout-units`): **41/41 đạt**;
  - 7 đột biến (mục 2).
- **Dọn dẹp:** đã xóa container và worktree.

**CI:** run `42271766644` @ `92d16358`.
- Đã xanh: `format · lint · audit · test · build` (toàn bộ unit và integration trên Postgres 17), API contract, OpenAPI lint, gitleaks, landing, confidential paths.
- `infra scripts (shellcheck)` đỏ do test `postgres-log-terse` chập chờn (FB-R5-ARC-OPS-11). #126 sửa lỗi này, PR #99 không liên quan.
- `docker images build · E2E smoke` còn đang chạy lúc ghi.

## 0. Kết luận: **DUYỆT** @ `92d16358`

Hai điều kiện của bản trước đã xong:
- (1) DOM PR99-01, mốc hoa hồng;
- (2) FB-R5-ARC-BE-A2-01, `latestCheck` theo cửa sổ.

A2-02 và DOM PR99-02 cũng xong. Mã đúng hướng ARC đã chốt ở mục 3.1, 3.2 và thẻ A2-01 của bản trước. Phần gộp `main` không làm mất hay đổi phần nào của PR.

**Gộp khi:**
- job E2E của run `42271766644` xanh;
- job `infra scripts` xanh sau khi chạy lại, hoặc sau khi #126 gộp.

**Thẻ cũ:**
- FB-R5-ARC-BE-A2-01 và A2-02: **ARC đóng (Done) khi #99 gộp**.
- DOM PR99-01 và PR99-02: ARC xác nhận mã đúng. DOM đóng thẻ của DOM.

**Thẻ mới:** 0 Blocker · 0 Major · 0 Minor · **2 Suggestion** (A2-03, A2-04). Không chặn gộp.

ESC mới: không.

## 1. Đối chiếu từng điểm

| Điểm (bản trước) | Mã @ `92d16358` | Kết quả |
|---|---|---|
| **DOM PR99-01 / ARC 3.1**: "tiền về sau trả phòng" = `folio.settled_at` | `tryEarnCommissions`: câu đầu đổi thành `FROM payment p JOIN folio f ON f.id = p.folio_id WHERE p.folio_id = $1 … AND f.settled_at IS NOT NULL AND p.created_at > f.settled_at`. Bỏ `JOIN reservation`, tham số chỉ còn `[folio.id]`. Câu thứ hai (BR-527, khoản người hưởng ghi) giữ nguyên. Chú thích hàm và chú thích tại chỗ đã sửa | Đúng từng ý của 3.1 |
| `settled_at` ghi đúng một lần | Rà lại trên nhánh đã gộp `main`: chỉ `FolioService.settle` (`folio.service.ts` 1349) ghi. Không đường nào xóa hay ghi lại. `bill.service.ts` chỉ đọc | Giữ đúng giả định của 3.1 |
| Bốn ca test của 3.1, đọc lại `commission.status` và `recognized_at` trong DB | 5 ca:<br>– DOM ca 1: VietQR 12:00/12:01, B18 12:03 → `earned` 12:03;<br>– `finalPayment` chuyển khoản, `checkoutAt` sớm hơn lúc bấm 20 phút → `earned` lúc B18;<br>– quá ngày đi: rời 22/11 11:00, ghi chuyển khoản 15:00, B18 23/11 09:00 → `earned` 23/11 09:00 (ca 3);<br>– thu nợ sau B18 → chờ đối soát, rồi `earned` ngày đối soát (ca 2);<br>– khoản CTV tự ghi còn `pending` → giữ (ca 4).<br>Mọi ca đọc lại bảng `commission` | Đủ, thêm một ca |
| **DOM PR99-02 / ARC 3.2**: `departedAt = d.checkout.at` cho mọi B18 | `const departedAt = d.checkout.at;`. `ResolvedCheckoutAt.at` luôn là `Date`, vì `readInput` buộc có `checkoutTime` hoặc `checkoutAt`. `ctx.now` vẫn dùng cho audit, chuyển trạng thái, `post_checkout_window_until`, `debt_opened_at`, `settled_at`. Chú thích nêu đủ | Đúng |
| Test PR99-02 | Ca B18 chỉ gửi `checkoutTime`, sớm hơn lúc bấm 40 phút, có ghi chú → `actual_checkout_at` và giờ đăng ký lưu trú = giờ gõ | Đúng biến thể T15-6 ARC đề xuất |
| **A2-01 (1)**: một hàm đoán trong `fridge.ts` | `countInWindow(liveBusinessDate, today, window)`. Có `countFrom` thì `>= countFrom`, không có thì `=== today`. `MinibarCheckoutPort.fridgeState` và `MinibarService.standard()` cùng gọi. Không còn bản viết thứ hai | Đúng |
| **A2-01 (2)**: `standard()` tự tính cửa sổ từ ngày đi **hiệu lực**, không viết SQL thứ tư cho BR-422 | Luật BR-422 dời vào `reservations/public/stay-departure.ts` (`stayDepartureDateOf`). `Reservation.stayDepartureDate` (`reservations.service.ts`) và `StayInfo.stayDepartureDate` (`read-port.ts`) cùng gọi hàm này. Câu SQL của luật còn đúng một chỗ. `countWindow` dùng `isOverdue` của `overdue-checkout.ts`. Đơn con thì lấy ngày đi của đơn chính, vì tủ thuộc đơn chính. `countWindow` chỉ chạy khi đã có lần đếm sống không phải hôm nay (nhờ `&&` ngắn mạch) | Đúng, gọn hơn đề xuất |
| **A2-01 (3)**: phạm vi HK không đổi | Không đổi chỗ nào của phạm vi đọc | Đúng |
| **A2-01 (4)**: test | – ca S2 lúc 12/01 06:30: `latestCheck` = lần đếm 10/01, tóm tắt không có tủ chưa đếm;<br>– đơn OTA gia hạn bằng đơn con: cửa sổ bắt đầu ở ngày đi của **đơn con**;<br>– unit `countInWindow`: không cửa sổ = K11-09; có `countFrom` thì từ ngày đi hiệu lực trở đi, không bao giờ trước.<br>Ca "đường thường 07:00, lần đếm hôm qua → `null`" là ca unit cộng các ca K11-09 có từ R4 | Đủ |
| **A2-02**: `Retry-After` cho `CONCURRENT_UPDATE` | `problem('CONCURRENT_UPDATE', { headers: { 'Retry-After': '1' } })`, giống `concurrencyProblem`. `problem.ts` đưa `headers` ra phản hồi (dòng 161). Có chú thích về lần gửi lại | Đúng. Chưa có test: thẻ A2-03 |
| Gộp `main` vào `audit-log.controller.ts` | So từng tệp: các dòng thêm/bớt của PR trong tệp này **giống hệt** bản `ba99bdb8`. Chỉ ngữ cảnh khác, vì #108 đã có trên `main`. Hai bộ lọc cùng tồn tại:<br>– `overdueOnly` ghim `category = state`, `action = reservation.checked_out`, `after ? 'overdue'`;<br>– `removalsOnly` / `reductionsOnly` ghim `money` / dòng sửa giảm.<br>Gửi cả hai thì trang rỗng, đúng luật "ghim bất kể client gửi gì" | Đúng. Có một lệch nhỏ cách đọc tham số: thẻ A2-04 |
| Các tệp khác của PR | 8 tệp không bị hai commit mã chạm có patch-id **trùng** bản `ba99bdb8`: `use-case-denial.ts`, `audit-entities.ts`, `frontdesk.controller.ts`, `ports.ts`, `payments.controller.ts`, `stay-actions.ts`, `allowed-actions.ts`, `overdue-checkout.ts` | Gộp không đổi mã |
| Xung đột | `git merge-tree` với `main` @ `816f6339`: sạch. Từ gốc gộp `cd4b4c1f` đến nay, `main` không đổi gì trong `product/services/api` hay `product/docs/api` | Không có |

Ghi chú hiệu năng: `readStayInfo` thêm một câu tổng hợp (`max(departure_date)` theo `parent_reservation_id`) ở mỗi lần gọi.
- Có 5 module gọi, mỗi request gọi một lần, không gọi trong vòng lặp. Chấp nhận được.
- Nếu sau này có chỗ gọi theo danh sách, nên dùng bản gom như `stayViews`.

## 2. Đột biến của ARC

| Đột biến | Test chạy | Kết quả |
|---|---|---|
| P1: mốc hoa hồng về lại `actual_checkout_at` | `v105-commission-anchor` | **3 đỏ** / 5 |
| P2: `p.created_at >= f.settled_at` (khoản ghi cùng lúc bị tính là sau trả phòng) | `v105-commission-anchor` | 1 đỏ |
| P3: `departedAt` chỉ lấy giờ gõ khi có `checkoutAt` (bản cũ) | `v105-overdue-checkout` | 1 đỏ |
| P4: bỏ `Retry-After` | `v105-overdue-checkout` và unit | **sống** (thẻ A2-03) |
| P5: `latestCheck` không có cửa sổ | `v105-overdue-checkout` | 1 đỏ |
| P6: cửa sổ theo ngày đi của đơn, không theo ngày đi hiệu lực | `v105-overdue-checkout` | 1 đỏ (ca đơn con) |
| P7: `countInWindow` dùng `>` thay `>=` | unit và `v105-overdue-checkout` | 5 đỏ |

Có 6/7 đột biến bị bắt. Test có giá trị thật.

## 3. Thẻ

### FB-R5-ARC-BE-A2-03
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/frontdesk/internal/checkout.service.ts` 1230 (@ `92d16358`); test `v105-overdue-checkout*.test.ts`
- Vấn đề: bỏ `Retry-After` khỏi 409 `CONCURRENT_UPDATE` của lần đọc lại dưới khóa thì không ca nào đỏ (đột biến P4).
- Vì sao quan trọng: header này là phần hợp đồng của mã lỗi, và client dựa vào nó để gửi lại ngay. Ở bản trước, đúng chỗ này đã thiếu mà không ai thấy. Không có test thì lần sửa sau có thể làm mất lại.
- Đề xuất sửa: thêm một ca unit gọn. Dựng `ProblemError` từ nhánh đó (hoặc gọi hàm kiểm tách ra), rồi kiểm `options.headers['Retry-After'] === '1'`. Nếu khó dựng khe tranh chấp thật thì không cần integration. Làm ở PR sau, v1.0.5 hoặc v1.0.6.
- Trạng thái: Open

### FB-R5-ARC-BE-A2-04
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/audit/internal/audit-log.controller.ts` 141–146 (@ `92d16358`), so với `boolQuery` dòng 53–57 (của #108)
- Vấn đề:
  - `overdueOnly` tự kiểm bằng lệnh riêng. Chỉ nhận `true` / `false`; `?overdueOnly=` (rỗng) → 422.
  - `removalsOnly` / `reductionsOnly` đi qua `boolQuery`, nơi rỗng được coi là `false`.
  - Cùng một kiểu tham số boolean trong một endpoint mà đọc theo hai cách.
- Vì sao quan trọng: client (Desk, báo cáo) dựng URL chung cho các ô lọc. Một ô để trống sẽ ra 422 ở `overdueOnly` mà không ra ở hai ô kia. Không sai dữ liệu, chỉ lệch hành vi.
- Đề xuất sửa: `const overdue = boolQuery('overdueOnly', overdueOnly);`, rồi bỏ khối kiểm riêng. Mã lỗi và `field` giữ nguyên. Làm khi tiện, có thể cùng PR của A2-03.
- Trạng thái: Open

## 4. Việc của ARC sau khi gộp

Ghi vào hợp đồng 0.3.14 (chỉ chữ) các mục 3, 5 và 6 của danh sách mục 4 bản trước. #99 đã làm đúng các mục này:
- "mọi B18 – giờ trả đã quy đổi";
- `LATE_CHECKOUT_AFTER_LIMIT` ở `checkoutAt`, 409 `CONCURRENT_UPDATE` kèm `Retry-After`;
- `MinibarStandard.latestCheck` theo ngày đi hiệu lực trên đơn quá ngày đi.

## 5. Điểm làm tốt

- Luật BR-422 được dời vào một hàm công khai của module reservations, thay vì viết câu SQL thứ ba. Vừa đóng A2-01, vừa bớt một chỗ trùng có từ trước.
- Test hoa hồng đọc lại bảng và kiểm cả `recognized_at` theo giờ. Có thêm ca `finalPayment` chuyển khoản, ngoài 4 ca ARC yêu cầu.
- Gộp `main` cẩn thận: tệp có xung đột thật (`audit-log.controller.ts`) giữ nguyên phần của cả hai PR.

## 6. Giả định

- G1: job E2E của run `42271766644` chưa xong lúc ghi. Kết luận dựa vào job build-test xanh (integration đầy đủ) và lần chạy của ARC.
- G2: Postgres ARC dùng là `postgres:17-alpine` bản đang có ở máy, chưa so digest với CI. Kết quả khớp CI xanh.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – đọc lại phần chênh PR #99 (BE-A2 PR-A1b, V5-15) ba99bdb8 → 92d16358: DUYỆT** (rounds/round-05/reviews/ARC-on-be-pr-99-delta.md). Hai điều kiện bản trước xong: DOM PR99-01 – tryEarnCommissions so khoản thu với folio.settled_at (chỉ settle ghi, một lần), 5 ca đọc lại commission.status/recognized_at; FB-R5-ARC-BE-A2-01 – fridge.ts countInWindow là luật duy nhất cho blocker B18/minibarUncheckedRooms và latestCheck, StayInfo.stayDepartureDate qua reservations/public/stay-departure.ts (luật BR-422 còn một câu SQL). DOM PR99-02 (departedAt = giờ khai cho mọi B18; ctx.now cho audit, chuyển trạng thái, post_checkout_window_until, debt_opened_at, settled_at) và A2-02 (Retry-After) xong. Gộp main giữ nguyên mã PR (8 tệp trùng patch-id; audit-log.controller giữ cả overdueOnly và removalsOnly/reductionsOnly của #108). ARC chạy: tsc sạch, 41/41 ca V5-15, đột biến 6/7 bị bắt (sống: bỏ Retry-After). Gộp khi E2E của run 42271766644 xanh và job infra scripts xanh (chập chờn OPS-11, #126 sửa). A2-01, A2-02 đóng khi gộp. Thẻ mới: A2-03 (test Retry-After), A2-04 (overdueOnly dùng boolQuery) – Suggestion. ARC ghi mục 3, 5, 6 vào 0.3.14. | ARC | Không ESC |`
