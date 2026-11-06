# ARC review PR #110, #131, #123 (BE-H) – V5-16 PR-B2, V5-30 `r5-h1b`, S1 (guard `request_hash`, B13 `dates[]`)

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- Các PR đã review (cả ba đều DRAFT, `base = main`):

  | PR | Nhánh | HEAD | Quy mô | Việc |
  |---|---|---|---|---|
  | [#110](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/110) | `r5-b2` | **`e870a1c9`** | 17 tệp, +1691/−129 | V5-16: chốt chặn BR-438 trên `adjustFolioLine`, `line_reduction_count`, `entered_in_error` (ARC B2-01, B1F-01) |
  | [#131](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/131) | `r5-h1b` | **`0594d165`** | 15 tệp, +833/−26 | V5-30: tạo bản ghi hoa hồng ở mốc "đạt", ghim tỷ lệ, khóa tỷ lệ chỉ OWN/MGR (DOM 101-01, ARC H1-01…03) |
  | [#123](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/123) | `r5-s1-tests` | **`e9942779`** | 12 tệp, +1129/−85 | S1: guard chỉ hoãn quyết định vai khi phát lại đúng `request_hash`, B13 `dates[]` mọi đêm, oracle T14-7 dạng bảng (SEC S1-01; ARC S1-01, S1-03, S1-04) |

  Lúc viết tệp này, ARC kiểm lại bằng `gh pr view`: ba head không đổi trong suốt lúc review. ARC cũng xem #133 (`r5-v516-minibar` @ **`0636f2fc`**), nhưng chỉ để trả lời một câu: hình dạng của #110 có chặn #133 không (mục 1.5).
- Đối chiếu:
  - `openapi.yaml`:
    - `adjustFolioLine` BR-438, dòng 5701–5712 ("kiểm sau khi tải dòng, dưới khóa L3, trước kiểm giá");
    - `foc_threshold` `link` có `month=`, dòng 11345;
    - `FocRequestInput.reasonCode` có `entered_in_error`, dòng 12107;
    - `updateReservation` (2817) và `ReservationPatch.closerUserId` (11983);
    - `getReservationHistory` (2845, x-roles có `front_desk`, `front_desk_lead`);
    - `listAuditEvents` (7271).
  - Review trước:
    - ARC: `ARC-on-be-pr-108-b1-filter.md` (B2-01, B1F-01, B1F-02), `ARC-on-be-pr-101-h1.md` (H1-01…03), `ARC-on-be-pr-103-s1.md` (S1-01…05);
    - SEC: `SEC-on-be-pr-103-s1.md` (S1-01, S1-03), `SEC-on-be-h-prs-110-131.md` (131-01, 123-01, 110-01);
    - DOM: `DOM-on-be-h-prs-110-131.md` (110-02…04, 131-01…04).
  - `plan.md` mục 4a: dòng T3, T5, T6 và dòng R5-B-13.
- Cách kiểm:
  - Đọc mã bằng `gh pr diff` và `git show <sha>:<path>`, trên các ref riêng `refs/remotes/arc/pr*`. Không checkout nhánh nào trong thư mục chính, không push vào nhánh PR.
  - Dựng hai worktree trong scratchpad (`arc-beh-wt`, `arc-beh-133`) và một PostgreSQL 17 riêng (container `arc-beh-review-pg`, chỉ nghe `127.0.0.1`, dùng mật khẩu CI công khai của repo). Tất cả đã xóa sau review.
  - Kết quả trên cây gộp `main` @ `6dbc9c82` + #110 + #131 + #123 (gộp theo thứ tự đó, git tự gộp, không xung đột):
    - `tsc --noEmit` sạch;
    - toàn bộ API: **201 tệp qua, 2 tệp tự bỏ qua, 4909 ca qua, 0 hỏng**.
  - Cây #133 @ `0636f2fc`, vốn đã chứa head #110: 4 tệp V5-16, 22/22 ca qua.
  - Thử đột biến: **25 đột biến**, mỗi lần sửa một chỗ, chạy lại tệp test của PR đó rồi trả mã về. Cả 25 đều làm test đỏ. Bảng chi tiết ở mục 1.4, 2.5 và 3.4.
  - Probe: một tệp test chỉ nằm trong scratchpad, không commit, đọc audit dưới vai FD/FDL sau B18 (mục 2.6). Tỷ lệ dùng giá trị thử `test_rate_short`.
- CI lúc commit:
  - #110: các job đang chạy lại sau lần gộp `main`;
  - #131, #133: đỏ job `infra scripts (shellcheck)` ở bước `postgres-log-terse`. Đây là lỗi chập chờn đã biết OPS-11, #126 sửa, không do PR;
  - #131, #123: E2E smoke còn đang chạy. Lỗi 429 ở V5-46-2 là lỗi của test, `main` đã sửa ở `1caa22f4`.
- Không gọi staging hay production. Tệp này không có bí mật, IP máy chủ, tỷ lệ thật hay dữ liệu khách.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Điều kiện | Thẻ ARC |
|---|---|---|---|
| **#110 @ `e870a1c9`** | **DUYỆT** | Không. Gộp trước #133 (T5) | 110-01 (Minor) |
| **#131 @ `0594d165`** | **DUYỆT** | Không chặn gộp #131. Với tag v1.0.5: SEC 131-01 và ARC 131-01 phải gộp trước khi cắt tag. Với kỳ chốt: DOM 131-01 và ARC 131-02 phải xong trước 01/12, cùng hạn PR-M | 131-01 (Major), 131-02 (Major), 131-03 (Suggestion) |
| **#123 @ `e9942779`** | **DUYỆT** | Gộp bằng **merge commit**, không squash, không rebase (allowlist gitleaks cho `ae4a8358`). Trước khi gộp, đổi tên và mô tả PR (thẻ 123-01) | 123-01 (Minor), 123-02 (Suggestion) |

Ghi chú:
- SEC đã DUYỆT cả ba PR. DOM đã DUYỆT #110 và #131. Bảng trên không nhắc lại các thẻ SEC và DOM. Mục 4 ghi chỗ đặt bản sửa cho SEC 131-01, DOM 131-01 và SEC 123-01, theo yêu cầu của ORC.
- Hình dạng của #110 không chặn #133 (mục 1.5).

### 0.1 Thứ tự gộp đề xuất

1. **#110** trước, rồi **#133** (T5). #133 đã xếp trên đúng head của #110.
2. **#131** gộp lúc nào cũng được sau #110. Ba PR gộp sạch theo thứ tự 110 → 131 → 123. #131 phải gộp trước PR-M (T6).
3. **#123** độc lập với hai PR kia.
4. Sau khi #110 gộp: PR nhỏ cho SEC 131-01 và ARC 131-01, cắt từ `main` (mục 4.1).
5. Sau khi #131 gộp: PR `r5-h1c` cho DOM 131-01 và ARC 131-02 (mục 4.2).

---

## 1. PR #110 @ `e870a1c9` – V5-16 PR-B2

### 1.1 Bốn điểm ORC giao

| Điểm | Kết quả | Chỗ |
|---|---|---|
| Cổng mới `audit/public/line-reductions.ts`; `audit_event` không nằm trong `REPORTING_READ_TABLES` | **Đúng.** Tệp chỉ import `db/database`, `db/schema/folio` (kiểu). Tệp xuất `LINE_REDUCTION_ACTION`, `NIGHT_LINE_CATEGORIES`, `lineAmountOf`, `lineReductionWhere(alias, ph, { removalsOnly, reductionsOnly })` và `countLineReductionsByActor`. Hàm đếm lọc `before->>'actorRole'`, `GROUP BY actor_user_id HAVING count > above` và chỉ trả `{ actorUserId, n }`. Trên `main`, `audit_event` vốn chưa từng có trong danh sách. #110 thêm test giữ điều đó: `expect(READS).not.toContain('audit_event')` | `line-reductions.ts`; `reporting.module.ts` (chỉ sửa chú thích); `module-boundaries.test.ts` |
| Số đếm lọc theo `after.category`, như bộ lọc | **Đúng, và tương đương với cách lọc cũ.** Cả bốn chỗ ghi `folio_line.adjusted` đều ghi cùng `category` ở `before` và `after`: `folio-lines.service.ts` dòng 710, 736, 771 và `minibar.service.ts` của #133. Vì vậy chuyển từ `before.category` sang `after.category` không làm mất hay thêm dòng nào. Số được so bằng `jsonb_typeof = 'number'`, nên bản ghi cũ hay bản ghi lạ không gây lỗi ép kiểu | `line-reductions.ts` `lineReductionWhere` |
| `link` giữ `month=` như hợp đồng 0.3.13 | **Đúng:** `/audit?reductionsOnly=true&month=YYYY-MM&actorUserId=…` (`attention-sources.ts` dòng 214), khớp `openapi.yaml` dòng 11345. **ARC rút gợi ý `from`/`to`** ghi trong B2-01: `link` là đường dẫn trên Desk, không phải tham số API, và link `approvals` bên cạnh cũng dùng `month=`. Chênh mốc 06:00 ghi ở thẻ 110-01 | `reporting/internal/attention-sources.ts` (d), dòng 197–219 |
| Xung đột khi gộp `main` ở `audit-log.controller.ts` | **Gỡ đúng.** Còn một `boolQuery`. Giữ `AFTER_CLOSURE_ACTIONS` (dòng 83) và `afterClosureOnly` (dòng 139, 160, 222–223) của PR-B3. Mệnh đề sửa giảm gọi `lineReductionWhere` (dòng 220). Đã bỏ `amountOf`, `ROOM_MONEY_CATEGORIES` và `LINE_REDUCTION_ACTION` cũ khỏi controller; `git grep` ở head không còn nơi nào import chúng | `audit/internal/audit-log.controller.ts` |

### 1.2 Đối chiếu hợp đồng BR-438

- Thứ tự kiểm khớp `openapi.yaml` dòng 5701–5712. Trong `folio-lines.service.ts` `adjust` (dòng 594–607), BR-438 được kiểm sau khóa L3 và sau khi tải dòng, trước khi kiểm nợ và kiểm giá. Folio đã chốt đi nhánh A32 trước, nên không bao giờ gợi ý FOC trên folio đã chốt. Đây là ca DOM 110-03 muốn khóa bằng test.
- Gốc của dòng được tìm qua chuỗi `related_line_id` bằng CTE đệ quy (`folio/public/line-reduction.ts` `rootLineOf`). FD/FDL tự sửa giảm được khi đủ ba điều kiện:
  - dòng gốc nhập tay (A30 hoặc `minibar_check`);
  - chính người đó nhập;
  - trong cùng ngày kinh doanh (mốc 06:00).
  Thiếu một điều kiện thì trả 403 `FORBIDDEN_ACTION` với `requiredFlow: foc_request`.
- `access.denied` ghi **sau rollback**: `folio.controller.ts` dòng 314–333 bắt `ProblemError` có `auditReason = 'BR-438'`. Bản ghi không có số tiền hay id dòng, khớp SEC.
- Ghi audit gom về một chỗ (`settledReduction`, dòng 707). Bộ lọc và số đếm cùng đọc một dạng bản ghi.
- `entered_in_error`:
  - `line-labels.ts` thêm `guestFacing` và `GUEST_HIDDEN_REASONS = ['entered_in_error']`;
  - `bill.service` đặt `guestFacing: true`, nên bill không in lý do nội bộ;
  - test `ota-prepaid-flow` sửa theo luật mới: FD bỏ dòng → 403, MGR → 201.

### 1.3 Trạng thái thẻ cũ của ARC

| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-B2-01 (Major) | **Done** | Cổng, danh sách NIGHT dùng chung, `lineReductionWhere`, `countLineReductionsByActor`, test ranh giới, test đối chiếu số đếm với danh sách: đủ cả. Ý `from`/`to` của link đã rút (mục 1.1) |
| FB-R5-ARC-BE-B1F-01 | **Done** | Hai ca 05:59 và 06:00 có test, đột biến M3 đỏ 4 ca |
| FB-R5-ARC-BE-B1F-02 | Open | Việc của FE-A và BA, không thuộc PR này |
| architecture.md mục 5.1 (B2-01 ý cuối) | Open, việc của ARC | Ghi cổng `audit/public/line-reductions.ts` vào mục 5.1 (mục 6) |

### 1.4 Thử đột biến #110

| # | Đột biến | Ca đỏ |
|---|---|---|
| M1 | Số đếm bỏ lọc vai lúc sửa (`actorRole`) | 1 |
| M2 | `typedByHand` bỏ `minibar_check` | 5 |
| M3 | Bỏ điều kiện cùng ngày kinh doanh | 4 |
| M4 | Bỏ điều kiện "chính người đó nhập" | 4 |
| M5 | Không ghi `access.denied` | 5 |
| M6 | Số đếm gồm cả dòng tiền đêm | 2 |
| M7 | Bill in dòng có lý do `entered_in_error` | 2 |
| M8 | Chỉ đếm lần bỏ dòng, không đếm lần hạ số | 4 |
| M9 | `limitedByBr438` luôn trả `false` | 7 |

### 1.5 #133 so với #110

- `minibar.service.ts` R7 của #133 dùng `rootLineOf`, `reductionScope` và `isLineReduction` từ `folio/public/line-reduction.ts` để ghi `folio_line.adjusted` (lý do `minibar_recount`).
- Ba hàm này giống hệt nhau giữa `r5-b2` @ `a615eaf2` (bản #133 xếp lên lúc đầu) và head `e870a1c9`. Vì vậy **hình dạng của #110 không chặn #133.**
- Xung đột của #133 nằm ở `countWindow` của #99. BE-A2 đã gộp đúng: giữ cả hai. #133 nay xếp trên đúng head #110 (`git merge-base --is-ancestor e870a1c9 0636f2fc` → có), và chỉ thêm 2 tệp so với #110.
- Gộp #133 ngay sau #110. Phần tag thì xem DOM 110-02: câu sổ tay chỉ đúng khi #133 có trong tag.

---

## 2. PR #131 @ `0594d165` – V5-30 `r5-h1b`

### 2.1 `tryEarnCommissions` sau khi gộp #99

Thứ tự đọc ở `folio.service.ts`, bắt đầu từ dòng 1501:
1. Khi có `stay.stay`, gọi `ensureCommission` (dòng 1515).
2. Gọi `moneyPosition`.
3. Truy vấn tiền chưa đối soát, mốc là `p.created_at > f.settled_at` (dòng 1533). Đây là mốc "sau trả phòng" mà #99 đặt.
4. Chuyển các bản ghi `projected` đến hạn sang `earned`.

Thứ tự này đúng. Bản ghi được tạo trước khi quyết định "đạt", nên lần "đạt" đầu tiên vừa tạo vừa chuyển trạng thái trong cùng giao dịch. Lần chạy lại không thêm bản ghi thứ hai.
- `ensureCommission` (dòng 1657) bỏ qua khi thiếu người chốt, đơn không phải ngắn ngày, hoặc không có đêm. Nó cũng bỏ qua khi `count(*) WHERE status <> 'void'` > 0. Còn lại thì gọi `syncCommission(netNights(stay), today)`. Cơ sở là doanh thu đêm **ròng**, đúng S4-03.
- Chỗ bỏ qua "có bất kỳ bản ghi không `void`" chính là chỗ DOM 131-01 (a) chỉ ra. ARC 131-02 đề xuất thu hẹp nó.

### 2.2 Mọi nơi gọi đều truyền `stay`

| Nơi gọi | Truyền `stay` | Ghi chú |
|---|---|---|
| `checkout.service.ts` B18 | Có: `stay: await this.s.stay.confirmedStay(tx, row)` | Đột biến N6 đỏ 2 ca |
| `payments.service.ts` `tryEarn` (dòng 930) | Có, khi đơn `checked_out` | Ba chỗ gọi `tryEarn` (dòng 354, 722, 916). Các đường thu tiền mới của #105 (thu nợ sau trả phòng, VietQR đúng bước) đều đi qua ba chỗ này. Đột biến N4 đỏ 1 ca |
| `foc.service.ts` `afterWriteOff` | Có, qua cổng tùy chọn `RESERVATION_SALES_PORT.confirmedStayOf` | Bộ dựng worker không có cổng này, nhưng J1 không bao giờ quyết `debt_write_off`, nên không sót đường nào. `sales-port.adapter` `confirmedStayOf` dùng `loadReservation` với `SYSTEM_ACTOR`, không `forUpdate`, nên không đảo thứ tự khóa. Đột biến N5 đỏ 1 ca |

- Xóa nợ trên dòng tiền phòng cũng nhất quán: `syncReductions → syncNightDiscounts` chạy trước `afterWriteOff`, nên `netNights` đã trừ số xóa nợ. Test hiện chỉ xóa nợ một dòng `fnb` (thẻ 131-03).

### 2.3 Ghim tỷ lệ và khóa tỷ lệ

- Thứ tự đọc tỷ lệ trong `syncCommission`:
  1. ảnh chụp giá của đơn;
  2. `pinnedCommissionRate` (dòng 4171): tỷ lệ của bản ghi đầu tiên cùng `payee_type`, mọi trạng thái, xếp theo `created_at, id`;
  3. bảng hiệu lực hôm nay.
  Không ghi ngược vào ảnh chụp giá, vì `reservations` sở hữu ảnh chụp đó. Đúng H1-03.
  - DOM 131-02 đề xuất một thứ tự đọc chung cho mọi nơi (bước 3 dùng ngày tạo đơn, kể cả tỷ lệ 0). ARC đồng ý, làm ở v1.0.6.
  - Chỗ đặt: một hàm `commissionRateOf(tx, stay, payee)` trong `folio/public/`. `syncCommission`, mốc "đạt", PR-M (`commission_rate_missing`) và DATA cùng gọi hàm này, không nơi nào tự đọc ảnh chụp.
- `platform/public/commission-keys.ts` có `SHORT_STAY_COMMISSION_KEY` và `COMMISSION_RATE_KEYS` (3 khóa, có sẵn khóa của PR-M).
  - `parameters.service` `hidden()` trả `!canSeeRestricted(roles)` cho các khóa này, và xét trước mọi ngoại lệ của FDL. Lịch sử của khóa trả 404 như khóa không tồn tại.
  - `parameter-shapes` `commissionTableIssue` được nối vào `parameter-rules`.
  - H1-01 xong ở màn Tham số. Đường audit vẫn còn hở (mục 2.6).

### 2.4 Trạng thái thẻ cũ của ARC

| Thẻ | Trạng thái |
|---|---|
| FB-R5-ARC-BE-H1-01 (Major) | **Done ở màn Tham số.** Đóng hẳn khi ARC 131-01 gộp, vì FD/FDL còn đọc tỷ lệ qua audit |
| FB-R5-ARC-BE-H1-02 (Minor) | **Done** (luật lưu bảng tỷ lệ; đột biến N8 đỏ 14 ca) |
| FB-R5-ARC-BE-H1-03 (chỗ đặt) | **Done:** ghim ở phía folio; `ensureCommission` đi qua cổng `FolioStaySync` |

### 2.5 Thử đột biến #131

| # | Đột biến | Ca đỏ |
|---|---|---|
| N1 | Bỏ `ensureCommission` trong `tryEarnCommissions` | 4 |
| N2 | `ensureCommission` chỉ bỏ qua khi có bản ghi `projected` | 1 |
| N3 | Bỏ tỷ lệ ghim | 1 |
| N4 | `payments.tryEarn` không truyền `stay` | 1 |
| N5 | `foc.afterWriteOff` không truyền `stay` | 1 |
| N6 | B18 không truyền `stay` | 2 |
| N7 | `hidden()` bỏ các khóa hoa hồng | 1 |
| N8 | Bỏ luật lưu bảng tỷ lệ | 14 |

### 2.6 Probe: đường lộ thứ hai, ngoài phần SEC 131-01 đã nêu

Probe (chỉ trong scratchpad): FD làm B18 trên đơn có sale chốt, tỷ lệ thử `test_rate_short`, rồi đọc:

| Đường đọc | Vai | Kết quả |
|---|---|---|
| `GET /audit-events` (chính mình) | FD | 200, **7 bản ghi `commission.*`**. Khớp SEC 131-01 |
| `GET /reservations/{id}/history` (`getReservationHistory`) | FD | 200. `commission.projected` có `status, baseVnd, ratePct, amountVnd, payeeType`; `commission.earned` có `status, amountVnd`; `folio.line_posted` có `commissionVnd` |
| `GET /reservations/{id}/history` | FDL | 200, 2 bản ghi `commission.*` |

- Nguyên nhân nằm ở `reservations/internal/rack.service.ts` `history` (dòng 516, truy vấn ở dòng 536). Hàm chọn **mọi** `audit_event` có `(entity_type = 'reservation' AND entity_id = …) OR entity_code = <mã đơn>`, rồi trả `before`/`after` nguyên vẹn. Bản ghi hoa hồng ghi `entityCode = mã đơn` (`foc.service.ts:308`; `folio.service.ts` 1556, 1596, 3942, 4101), nên lọt vào lịch sử đơn.
- Đường này **không lọc theo người làm**. FD/FDL thấy hoa hồng của mọi đơn họ mở, không chỉ đơn họ thao tác. Phạm vi lộ rộng hơn `listAuditEvents`.
- Nếu chỉ sửa `listAuditEvents` như đề xuất 1 của SEC 131-01, lỗ vẫn mở. Thẻ ARC 131-01 gom cả hai đường về một chỗ.
- Còn ba nơi khác đọc `audit_event` trong `src`, không lộ hoa hồng:
  - `housekeeping/internal/work-orders.service.ts:196` (bản ghi phiếu việc);
  - `identity/internal/auth.service.ts:368` (`mfa.verified`, chỉ `SELECT 1`);
  - `audit/public/line-reductions.ts` (chỉ đếm).

---

## 3. PR #123 @ `e9942779` – S1

ORC đã đính chính: PR này **không chỉ có test**. PR sửa 5 tệp `src` (+78/−36), ARC review như mã:

### 3.1 Năm tệp `src`

| Tệp | Thay đổi | Đánh giá |
|---|---|---|
| `shared/http/request-hash.ts` (mới) | `canonicalJson`, `isBinaryBody`, `requestHash(method, path, body)` | Một hàm băm dùng chung cho guard và UnitOfWork. Không vòng phụ thuộc. Đệ quy không giới hạn độ sâu (SEC 123-01; chỗ sửa ở mục 4.3) |
| `shared/http/unit-of-work.ts` | Xuất lại hai hàm, bỏ bản sao cũ | Cùng `pathOf` (không gồm query string) và cùng `req.body`. Đột biến P2 (băm gồm query string) đỏ |
| `shared/http/auth.guard.ts` | `hasCompletedKey` (dòng 381): thân nhị phân → `false` (dòng 392); thêm `AND request_hash = $5` (dòng 407), băm bằng `requestHash` (dòng 400) | Chỉ chạy khi vai **không** được phép (dòng 374). Guard nay chỉ hoãn quyết định vai khi đúng là phát lại: cùng method, path và thân. **Đóng SEC S1-01** |
| `frontdesk/internal/stay.service.ts` B13 (dòng 361–438) | Gom mọi đêm ngoài khung vào `outOfRange` rồi mới ném. Nếu một đêm ngoài khung đứng trước một đêm thiếu giá mặc định, ném `rateOutOfRange` trước | Đúng ARC S1-03: client nhận đủ `dates[]` trong một lần. Đột biến P4 (ném ở đêm đầu) đỏ |
| `reservations/public/rate-out-of-range.ts` | Thêm tùy chọn `legacyDate` | Giữ `date` (đêm đầu) cho client cũ, thêm `dates[]`. Không phá client. Đột biến P5 đỏ 2 ca |

Hành vi API đổi, cần ghi vào hợp đồng 0.3.14 (mục 6). FE/MOB không phải sửa gì:
- (i) Vai không được phép dùng lại một `Idempotency-Key` đã xong, với **thân khác**: trước #123, guard hoãn quyết định và UnitOfWork trả 422 `IDEMPOTENCY_KEY_REUSED`; nay trả **403** kèm `access.denied`. Đúng hơn, vì không để lộ việc key đã được dùng.
- (ii) Phát lại một lệnh multipart sau khi mất vai: nay trả **403**, không trả lại kết quả cũ. Đây là ngoại lệ có chủ ý của ADR-009: thân nhị phân không băm ổn định được, nên không coi là phát lại.

### 3.2 Test có kiểm đúng điều chúng nói

| Tệp test | Nhận xét |
|---|---|
| `request-hash-guard-units.test.ts` | Có ca thân nhị phân và ca thân khác. **Ca "no match" là ca vòng tròn:** ca này giả lập DB trả rỗng rồi kiểm guard trả `false`, tức chỉ kiểm lại bản giả lập, không kiểm câu SQL có `request_hash` (thẻ 123-02). Phần SQL đã được ca tích hợp `write-roles-gate` giữ (đột biến P1 đỏ 3 ca), nên không thiếu bảo vệ |
| `integration/write-roles-gate` | Hai ca P1 mới. Nhánh vai được phép nay đòi đúng 422, không nhận 4xx bất kỳ |
| `bug-r4-038-internal-added-night` (ca B13) | Tenant có `ota_base_rate`, nên hai biên bằng nhau. Kiểm được `dates[]` đủ mọi đêm |
| `v5-22-rate-bounds` | Thêm khối không có `ota_base_rate`, phủ nhánh biên lệch |
| `v5-14-quote-qa-branches`, `v5-14-quote-typed-rates` | Oracle T14-7 thành bảng 5 dòng (kênh `agent`, phụ thu người, giá niêm yết đổi giữa kỳ, gõ mọi đêm). Đột biến Q1, Q2 đỏ |
| `rate-out-of-range-units.test.ts` (mới) | Unit thuần cho `rateOutOfRange`: hai đêm khác biên → biên của `dates[0]`, kể cả khi đảo thứ tự đêm đầu vào. Đột biến P6 làm đỏ 7 ca, gồm các ca của tệp này và các ca tích hợp |

### 3.3 Trạng thái thẻ cũ

| Thẻ | Trạng thái |
|---|---|
| FB-R5-SEC-BE-S1-01 (Minor) | **Done** (SEC đã xác nhận) |
| FB-R5-ARC-BE-S1-01 (Minor) | **Done**: T14-7 dạng bảng, unit `rateOutOfRange`, khối V5-22 không có `ota_base_rate` |
| FB-R5-ARC-BE-S1-02 (Minor) | Open, v1.0.6 như đã hẹn (gom báo giá về `engine.price`); #123 không đụng `quote-pricing.ts` |
| FB-R5-ARC-BE-S1-03 (R5-B-13) | **Done**: B13 gom mọi đêm qua `rateOutOfRange`, giữ `date`. Xong sớm, đạt mức "v1.0.5 nếu BE-H kịp" của plan dòng 440 |
| FB-R5-ARC-BE-S1-04 | **Done**: cùng bản sửa với SEC S1-01 |
| FB-R5-ARC-BE-S1-05 (Suggestion) | Open (snapshot `agreedRateVnd`), không thuộc PR này |

### 3.4 Thử đột biến #123

| # | Đột biến | Ca đỏ |
|---|---|---|
| P1 | Guard bỏ điều kiện `request_hash` | 3 |
| P2 | Băm gồm query string | 1 |
| P3 | Bỏ kiểm thân nhị phân | 1 |
| P4 | B13 ném ở đêm ngoài khung đầu tiên | 1 |
| P5 | Bỏ `legacyDate` | 2 |
| P6 | Bộ dựng lỗi lấy đêm cuối thay cho đêm đầu | 7 |
| Q1 | Tiền cọc báo giá gồm phụ thu người | 1 |
| Q2 | Phụ thu người ít hơn một đêm | 1 |

---

## 4. Chỗ đặt bản sửa (theo yêu cầu của ORC)

### 4.1 SEC 131-01: FD/FDL đọc hoa hồng qua audit → thẻ ARC 131-01

- **Không đặt danh sách khóa hoa hồng trong module `audit`.** Hoa hồng là dữ liệu của `folio`; PR-M sẽ thêm khóa thưởng. Module sở hữu dữ liệu tự khai báo cái gì hạn chế, đúng cách `defineAuditEntity` đang làm.
- Thêm tệp `audit/public/audit-visibility.ts` với ba hàm:
  - `defineManagerOnlyAudit({ entityTypes?: string[]; fields?: string[] })`: sổ đăng ký hạn chế. `folio/audit-entities.ts` gọi `defineManagerOnlyAudit({ entityTypes: ['commission'], fields: ['commissionVnd'] })`. Tệp này được mọi tiến trình nạp (api, worker, CLI), như `defineAuditEntity`. PR-M thêm khóa thưởng cùng cách;
  - `auditVisibleWhere(alias, ph, roles)`: trả mệnh đề `alias.entity_type <> ALL(<danh sách hạn chế>)` khi người gọi không có OWN/MGR, trả rỗng khi có;
  - `redactAuditFields(value, roles)`: bỏ các khóa hạn chế khỏi `before`/`after` khi người gọi không có OWN/MGR.
- Hai nơi đọc phải dùng cả hai helper:
  - `audit/internal/audit-log.controller.ts` `listAuditEvents`: nhánh `!full` (dòng 215–216 @ `0594d165`) và phần map `before`/`after` (256–273);
  - `reservations/internal/rack.service.ts` `history` (dòng 516–590): điều kiện ở dòng 536, che khóa lúc map. Áp cho FD/FDL. MGR/OWN thấy đủ.
- Thêm một test quét: mọi `FROM audit_event` trong `src` (trừ `migrations`) phải gọi `auditVisibleWhere`, hoặc nằm trong danh sách ngoại lệ có lý do. Danh sách hôm nay có `work-orders.service.ts`, `auth.service.ts` (mfa), `line-reductions.ts` (chỉ đếm). Viết theo mẫu `module-boundaries.test.ts`. Nơi đọc audit thứ ba sau này không lọt lưới được nữa.
- Lọc lúc đọc, không đổi cách ghi, không migration. Dữ liệu đã ghi trên production cũng được che.
- **Làm trong một PR nhỏ riêng của BE-H, cắt từ `main` sau khi #110 gộp**, không làm trong #131:
  - giữ nguyên head `0594d165` mà SEC, DOM và ARC đã duyệt;
  - `audit-log.controller.ts` là tệp #110 vừa sửa (mục 1.1), làm sau #110 thì không xung đột;
  - PR mới phải gộp trước khi cắt tag v1.0.5. PO thêm một dòng vào plan 4a.
- ARC viết câu hợp đồng cho cả `listAuditEvents` và `getReservationHistory` (mục 6). SEC xem lại PR mới (phần quyền), ARC xem phần cổng.

### 4.2 DOM 131-01: đổi người chốt không chuyển hoa hồng; đổi sau nhận phòng chỉ OWN → thẻ ARC 131-02

- **Trước nhận phòng** (`status = confirmed`, `actual_checkin_at IS NULL`). MGR+ đổi được, như hiện nay (EP02 5.4):
  - `reservations/internal/reservations.service.ts` PATCH: hiện chỉ ghi `reservation.closer_changed` (dòng 1564–1575), còn `money.resynced` chỉ chạy khi `repriced` (dòng 1629). Khi `closerUserId !== row.closer_user_id` mà không `repriced`, gọi đồng bộ hoa hồng trong **cùng giao dịch**, sau `loadReservation` (dòng 1628);
  - cổng: thêm vào `reservations/public/folio-sync-port.ts` `FolioStaySync` một phương thức `syncCommission(tx, stay, actor, { voidReason })`. `MoneyBridge` thêm `closerChanged(...)`;
  - phía `folio/public/folio.service.ts`: phương thức mới gọi `netNights` rồi `syncCommission` riêng tư (dòng 4039), truyền `voidReason` (mặc định `resync`, ở đây là `closer_changed`). `ensureCommission` trở thành điều kiện bảo vệ cộng với phương thức này;
  - bản ghi người mới lấy tỷ lệ ghim (bản ghi đầu cùng `payee_type`), nên đổi người không đổi tỷ lệ. Nếu loại người hưởng khác (sale ↔ CTV) thì đọc theo thứ tự chung ở mục 2.3;
  - `void_reason` là cột `text` có ràng buộc `NOT NULL khi void` (migration 0011), nên không cần migration;
  - thứ tự khóa: L1 (đơn) rồi các dòng `commission` `FOR UPDATE`, giống B18 (L1 → L3 → `commission`). Không đảo khóa.
- **Sau nhận phòng** (`actual_checkin_at` có giá trị, hoặc `status = in_house`): chỉ OWN được đổi, và phải có lý do:
  - thêm trường tùy chọn `ReservationPatch.closerChangeReason` (3–500 ký tự). ARC thêm ở **bổ sung 1h** của hợp đồng (mục 6). Thiếu trường này khi OWN đổi sau nhận phòng → 422 `VALIDATION_FAILED`;
  - MGR, FDL, FD → 403 `FORBIDDEN_ACTION`, kèm `access.denied` ghi sau rollback, theo mẫu `auditReason` của #110 (mục 1.2). Kiểm này đặt ngay cạnh kiểm MGR+ hiện có (dòng 1420–1428);
  - lý do ghi vào `after.reason` của `reservation.closer_changed`; thêm khóa `reason` vào allowlist `reservation`. Hoa hồng theo người OWN sửa, bản ghi cũ `void` với lý do `closer_corrected`;
  - cách này phủ cả ca **ghi lần đầu** người chốt sau nhận phòng (`null → B`), đúng BR-903 (3).
- **Lưới an toàn trong `ensureCommission`:** chỉ bỏ qua khi đã có bản ghi `earned`/`payable`/`paid`, hoặc đã có bản ghi `projected` của **đúng người chốt hiện tại**. Ngoài hai ca đó thì chạy đồng bộ, và đồng bộ sẽ `void` bản ghi `projected` của người cũ. Lưới này sửa luôn các đơn đã đổi người chốt trên production trước khi bản sửa lên. Tính chất "chạy lại không thêm bản ghi thứ hai" vẫn giữ. Đột biến N2 hiện có sẽ phải viết lại cho điều kiện mới.
- Đơn mà MGR **đã** đổi người chốt sau nhận phòng trên production thì không sửa tự động được: mã không biết lúc đó ai đúng. OPS chạy một truy vấn chỉ đọc trước khi cắt tag, tìm các `reservation.closer_changed` có `occurred_at` sau `actual_checkin_at`, rồi gửi danh sách mã đơn cho chủ đầu tư. Danh sách này không vào repo.
- **Làm trong một PR mới của BE-H (ví dụ `r5-h1c`), sau khi #131 gộp, trước PR-M và trước 01/12.** Test theo danh sách DOM 131-01 mục 3. Thêm hai ca:
  - đổi người chốt khi đơn chỉ có bản ghi `projected` → màn **Hoa hồng** ghi người mới ngay, chưa cần B18;
  - lưới an toàn với đơn đã đổi người trước khi bản sửa lên.
  Báo FE-A về trường `closerChangeReason` mới: ô lý do chỉ hiện cho OWN khi đơn đã nhận phòng.

### 4.3 SEC 123-01: `canonicalJson` không giới hạn độ sâu

- ARC đồng ý cách SEC đặt:
  - giới hạn độ sâu (32 tầng) **trong `request-hash.ts`**. Một chỗ sửa cho mọi nơi gọi: `unit-of-work.ts`, `guest-unit-of-work.ts`, `public-booking.service.ts` và guard. 32 là mức SEC đề xuất; BE-H đối chiếu với schema lồng sâu nhất trong `openapi.yaml` trước khi chốt số;
  - quá 32 tầng → 422 `VALIDATION_FAILED`;
  - bọc `requestHash` trong `try/catch` ở `hasCompletedKey`, lỗi thì `return false`, để guard luôn trả 403 kèm `access.denied`.
- Không đổi schema. ARC thêm câu 422 vào danh sách 0.3.14 (mục 6). BE-H làm trong v1.0.5 nếu kịp, cùng PR ở mục 4.1 cũng được (cùng tác giả, cùng lúc sau #110), không thì B-KYTHUAT.

### 4.4 Tóm tắt chỗ đặt

| Thẻ | Tệp chính | PR | Hạn | Người làm / xem |
|---|---|---|---|---|
| SEC 131-01 + ARC 131-01 | `audit/public/audit-visibility.ts` (mới), `folio/audit-entities.ts`, `audit-log.controller.ts`, `rack.service.ts`, test quét | PR nhỏ của BE-H, cắt từ `main` sau #110 | Trước khi cắt tag v1.0.5 | BE-H làm; SEC, ARC xem |
| DOM 131-01 + ARC 131-02 | `reservations.service.ts` PATCH, `folio-sync-port.ts`, `money-bridge.ts`, `folio.service.ts`, `openapi.yaml` (1h) | `r5-h1c`, sau #131 | Trước PR-M và 01/12 | BE-H làm; DOM, SEC (403), ARC xem; FE-A sửa ô lý do |
| SEC 123-01 | `request-hash.ts`, `auth.guard.ts` | Cùng PR nhỏ ở dòng 1, hoặc B-KYTHUAT | v1.0.5 nếu kịp | BE-H làm; SEC xem |
| DOM 131-02 (thứ tự đọc tỷ lệ) | `folio/public/` `commissionRateOf` | v1.0.6, trước hoặc cùng PR-M | v1.0.6 | BE-H làm; ARC xem |

---

## 5. Thẻ feedback ARC

### FB-R5-ARC-BE-110-01
- Mức độ: **Minor** (không chặn gộp #110; sửa chú thích và câu hợp đồng trong v1.0.5)
- Người sửa: BE-H (chú thích), ARC (câu 0.3.14), QA (ghi chú oracle)
- Vị trí:
  - `audit/public/line-reductions.ts` dòng 4 ("can never disagree");
  - `reporting/internal/attention-sources.ts` dòng 34 và (d), dòng 197–219;
  - `audit-log.controller.ts` dòng 195–196 (khung ngày `atLocal(dateFrom, '00:00')`).
- Vấn đề: cảnh báo và danh sách dùng cùng mệnh đề, nhưng **khác khung thời gian**:
  - số đếm tính theo tháng kinh doanh, từ 06:00 ngày 1 đến lúc tải (`atLocal(monthStart, rollover)`);
  - danh sách sau link `month=` tính theo ngày lịch, từ 00:00 ngày 1 đến hết ngày cuối tháng.
  Lần sửa giảm lúc 00:00–05:59 ngày 1 thuộc tháng kinh doanh **trước** trong số đếm, nhưng thuộc tháng **này** trong danh sách. Hai số lệch theo cả hai chiều.
  Thêm hai nguồn lệch nhỏ:
  - bản ghi cũ không có `actorRole`: không được đếm, nhưng vẫn hiện trong danh sách. DOM 110-04 (a) đã nêu cho tháng lên bản;
  - người đổi vai giữa tháng: số đếm lọc theo vai lúc sửa, danh sách chỉ lọc theo `actorUserId`.
- Vì sao quan trọng: chủ đầu tư thấy cảnh báo "5 lần" nhưng mở ra 4 hoặc 6 dòng. Lần sửa lúc nửa đêm đầu tháng lại là ca đáng xem nhất. Chú thích "never disagree" sẽ làm người sửa sau tin sai.
- Đề xuất sửa:
  1. BE-H: sửa hai chú thích thành "cùng mệnh đề; khung khác ở 00:00–05:59 ngày 1 và ở bản ghi không có `actorRole`". Không đổi mã ở v1.0.5.
  2. ARC: thêm câu 0.3.14 cho `foc_threshold` `line_reduction_count`: "Số đếm theo tháng kinh doanh (06:00 ngày 1). Danh sách mở từ `link` theo ngày lịch, có thể lệch ở các lần sửa 00:00–05:59 ngày 1."
  3. QA: oracle BR-438-04 ghi rõ khung của từng phía. Không viết ca đòi hai số bằng nhau ở ngày 1.
  4. v1.0.6, nếu chủ đầu tư thấy phiền: `listAuditEvents` nhận `businessMonth=YYYY-MM` (khung 06:00) và link dùng tham số này. Việc này cần đổi hợp đồng, nên không làm ở v1.0.5.
- Trạng thái: Open

### FB-R5-ARC-BE-131-01
- Mức độ: **Major** (không chặn gộp #131; phải gộp trước khi cắt tag v1.0.5, cùng hạn SEC 131-01)
- Người sửa: BE-H; SEC xem phần quyền; ARC xem cổng và viết câu hợp đồng; PO thêm dòng plan 4a
- Vị trí:
  - `reservations/internal/rack.service.ts` `history` (dòng 516–590 @ `0594d165`, truy vấn ở dòng 536);
  - `audit/internal/audit-log.controller.ts` `listAuditEvents` (dòng 215–216, 256–273);
  - `folio/audit-entities.ts` (allowlist `commission`, `folio.commissionVnd`);
  - mới: `audit/public/audit-visibility.ts`.
- Vấn đề:
  - Ngoài đường SEC 131-01 nêu (`listAuditEvents`, chỉ bản ghi của chính mình), `getReservationHistory` trả mọi bản ghi audit có `entity_code` là mã đơn, kèm `before`/`after` nguyên vẹn.
  - FD/FDL được gọi đường này (x-roles, `openapi.yaml` dòng 2845). Vì vậy họ đọc được `ratePct`, `baseVnd`, `amountVnd` của `commission.projected`, `amountVnd` của `commission.earned` và `commissionVnd` của `folio.line_posted`, trên **mọi** đơn họ mở. Probe mục 2.6: FD 200; FDL 200, 2 bản ghi.
  - SEC đề xuất đặt `COMMISSION_AUDIT_FIELDS` trong `audit/public`. Cách đó đặt kiến thức về hoa hồng vào module `audit`, và chỉ sửa được một trong hai đường.
- Vì sao quan trọng: cùng lý do SEC 131-01 (bảng tỷ lệ là bảng nội bộ của chủ đầu tư, A60, SR-AZ-04). Đường này rộng hơn, vì không giới hạn theo người làm. Sửa một đường mà để đường kia thì H1-01 vẫn chưa đóng được. Nơi đọc audit thứ ba sau này (PR-M, báo cáo ca v1.0.6) cũng sẽ lặp lại lỗi nếu không có cổng chung.
- Đề xuất sửa: mục 4.1. Tóm tắt:
  - (1) `audit/public/audit-visibility.ts` với `defineManagerOnlyAudit`, `auditVisibleWhere` và `redactAuditFields`; `folio/audit-entities.ts` khai báo `commission` và `commissionVnd`;
  - (2) dùng ở cả `listAuditEvents` và `rack.service.ts` `history`;
  - (3) test tích hợp: FD/FDL đọc cả hai đường sau B18 và sau thu nợ thì không có `commission.*` và không có `commissionVnd`; MGR/OWN vẫn thấy đủ. Thử đột biến từng đường;
  - (4) test quét `FROM audit_event`;
  - (5) PR nhỏ riêng, cắt từ `main` sau #110, gộp trước tag;
  - (6) ARC viết câu hợp đồng cho hai thao tác.
  Thẻ này cùng SEC 131-01 là điều kiện để đóng ARC H1-01 và SEC V530-02.
- Trạng thái: Open

### FB-R5-ARC-BE-131-02
- Mức độ: **Major** (có từ trước #131; không chặn gộp #131; xong trước PR-M và kỳ chốt 01/12)
- Người sửa: BE-H; ARC (bổ sung 1h); FE-A (ô lý do); DOM, SEC xem
- Vị trí:
  - `reservations/internal/reservations.service.ts` PATCH (dòng 1420–1428 kiểm MGR+; 1564–1575 `reservation.closer_changed`; 1629 `money.resynced` chỉ khi `repriced`);
  - `reservations/public/folio-sync-port.ts` `FolioStaySync`;
  - `reservations/internal/money-bridge.ts`;
  - `folio/public/folio.service.ts` `ensureCommission` (1657), `syncCommission` (4039).
- Vấn đề:
  - Đây là chỗ đặt cho DOM 131-01 (a) và (b). Đổi người chốt không đồng bộ hoa hồng, nên B18 chuyển bản ghi của **người cũ** sang `earned`.
  - Sau nhận phòng, MGR vẫn đổi được người chốt mà không cần lý do. Từ #131, B18 còn tạo bản ghi cho người chốt mới nếu đơn chưa có bản ghi.
  - `syncCommission` vốn đã biết `void` bản ghi của người khác. Chỉ thiếu lời gọi, và thiếu luật quyền sau nhận phòng.
- Vì sao quan trọng: chi hoa hồng sai người, màn Hoa hồng lệch với đơn, và quản lý có đường gán hoa hồng trên lượt đang ở (DOM 131-01).
- Đề xuất sửa: mục 4.2. Tóm tắt:
  - (1) đổi người chốt trước nhận phòng → đồng bộ hoa hồng trong cùng giao dịch, qua phương thức mới `FolioStaySync.syncCommission(..., { voidReason: 'closer_changed' })`; tỷ lệ ghim giữ nguyên;
  - (2) sau nhận phòng → chỉ OWN, bắt buộc `closerChangeReason` (3–500 ký tự, bổ sung 1h); vai khác nhận 403 `FORBIDDEN_ACTION` kèm `access.denied`; bản ghi cũ `void` với lý do `closer_corrected`;
  - (3) lưới an toàn trong `ensureCommission`: chỉ bỏ qua khi có `earned`/`payable`/`paid`, hoặc có `projected` của đúng người chốt hiện tại;
  - (4) OPS chạy truy vấn chỉ đọc, liệt kê các đơn đã đổi người chốt sau nhận phòng, gửi danh sách cho chủ đầu tư, không vào repo;
  - (5) PR `r5-h1c` sau #131, test theo DOM 131-01 mục 3 cộng hai ca ở mục 4.2.
  Không migration.
- Trạng thái: Open

### FB-R5-ARC-BE-131-03
- Mức độ: Suggestion
- Người sửa: BE-H (hoặc QA cùng ca DOM 131-03 (3))
- Vị trí: `test/integration` của #131 (các ca xóa nợ); `foc.service.ts` `afterWriteOff`
- Vấn đề: test chỉ xóa nợ trên một dòng `fnb`. Ca xóa nợ trên **dòng tiền phòng**, khi `ensureCommission` vừa tạo bản ghi ở mốc xóa nợ, chưa có test. Ca này đúng nhờ thứ tự `syncReductions → syncNightDiscounts → afterWriteOff` (mục 2.2), nhưng chưa có test nào giữ thứ tự đó.
- Vì sao quan trọng: nếu sau này ai đó chuyển `afterWriteOff` lên trước, cơ sở hoa hồng sẽ gồm cả tiền đã xóa nợ, và không test nào đỏ.
- Đề xuất sửa: một ca. Đơn sale 2 đêm, thiếu tỷ lệ lúc tạo; chủ đầu tư lưu `test_rate_short`; xóa nợ một phần tiền một đêm. Kỳ vọng: cơ sở = tiền phòng − số xóa nợ, bản ghi `earned`. Ghép với DOM 131-03 (3).
- Trạng thái: Open

### FB-R5-ARC-BE-123-01
- Mức độ: Minor (sửa trước khi gộp; chỉ đổi chữ trên GitHub)
- Người sửa: BE-H
- Vị trí: tiêu đề và mô tả PR #123 ("S1 tests – …")
- Vấn đề: tên PR nói "tests", nhưng PR đổi 5 tệp `src` và đổi hành vi API ở hai chỗ (mục 3.1 (i), (ii)). Merge commit và changelog v1.0.5 lấy tên PR, nên người đọc lịch sử sẽ tưởng đây là PR chỉ có test và bỏ qua khi tìm nguyên nhân một lỗi 403.
- Vì sao quan trọng: ORC đã giao review theo đúng tên PR ("không đổi `src`"). Người khác cũng sẽ đọc như vậy.
- Đề xuất sửa: đổi tiêu đề thành ví dụ `round-5: BE-H S1 – guard defers only on a true replay (request_hash), B13 dates[] every night, T14-7 table`. Trong mô tả, ghi 5 tệp `src` và hai thay đổi hành vi (403 thay 422 khi thân khác; multipart sau khi mất vai → 403).
- Trạng thái: Open

### FB-R5-ARC-BE-123-02
- Mức độ: Suggestion
- Người sửa: BE-H
- Vị trí: `test/request-hash-guard-units.test.ts`, ca "no match"
- Vấn đề: ca này cho DB giả trả rỗng, rồi kiểm guard trả `false`. Điều đó luôn đúng, kể cả khi câu SQL bỏ `request_hash`. Ca không kiểm điều tên ca nói.
- Vì sao quan trọng: không thiếu bảo vệ, vì ca tích hợp `write-roles-gate` đã giữ điều kiện này (P1 đỏ 3 ca). Nhưng ca vòng tròn làm số ca trông nhiều hơn số kiểm thật.
- Đề xuất sửa: cho DB giả kiểm tham số. Ví dụ, kiểm `$5` bằng `requestHash(method, path, body)` và câu SQL có `request_hash = $5`. Nếu không thì bỏ ca này, để ca tích hợp giữ.
- Trạng thái: Open

---

## 6. Việc của ARC sau review này

1. `architecture.md` mục 5.1: ghi cổng `audit/public/line-reductions.ts` (B2-01) và, khi PR ở mục 4.1 gộp, cổng `audit/public/audit-visibility.ts`: "mọi nơi đọc `audit_event` cho người không có OWN/MGR phải đi qua `auditVisibleWhere` và `redactAuditFields`".
2. Thêm vào danh sách 0.3.14:
   - (a) `foc_threshold` `line_reduction_count`: khung tháng kinh doanh của số đếm khác khung ngày lịch của danh sách (110-01);
   - (b) `listAuditEvents` và `getReservationHistory`: "FD/FDL không thấy bản ghi `entityType = commission`; khóa `commissionVnd` (và khóa thưởng của PR-M) bị bỏ khỏi `before`/`after`. OWN/MGR thấy đủ" (SEC 131-01, ARC 131-01);
   - (c) guard: vai không được phép dùng lại `Idempotency-Key` với thân khác → 403 (trước là 422 `IDEMPOTENCY_KEY_REUSED`); phát lại multipart sau khi mất vai → 403, ngoại lệ của ADR-009 (#123);
   - (d) B13 `RATE_OUT_OF_RANGE`: `dates[]` gồm mọi đêm ngoài khung; `date` giữ là đêm đầu (#123);
   - (e) thân lồng quá 32 tầng → 422 `VALIDATION_FAILED` (SEC 123-01, khi PR sửa gộp).
3. Bổ sung 1h của hợp đồng: `ReservationPatch.closerChangeReason` (tùy chọn, 3–500 ký tự; bắt buộc khi OWN đổi người chốt sau nhận phòng); 403 cho vai khác. Viết trước khi BE-H mở `r5-h1c`, rồi báo FE-A.
4. Xem PR ở mục 4.1 (phần cổng) và PR `r5-h1c` (phần cổng, thứ tự khóa) khi BE-H mở.

## 7. Ghi chú cho ORC

- Thứ tự gộp: mục 0.1. #123 gộp bằng merge commit.
- PO thêm vào plan 4a hai dòng:
  - "PR che hoa hồng trong audit (SEC 131-01 + ARC 131-01), sau #110, trước tag";
  - "`r5-h1c` (DOM 131-01 + ARC 131-02), sau #131, trước PR-M / 01/12".
- DOM 110-02: T5 nên ghi "PR #133 @ `0636f2fc`" và kiểm `git merge-base --is-ancestor` lúc cắt tag. ARC đồng ý.
- Tới khi `r5-h1c` gộp, BA giữ câu sổ tay tạm của DOM 131-01 mục 4 ("Sửa người chốt: sau khi lưu, mở **Hoa hồng** kiểm người hưởng").
- Tài nguyên tạm của ARC đã xóa hết (hai worktree, container PostgreSQL, các ref `refs/remotes/arc/pr110`, `pr131`, `pr123`, `pr133`, `pr133b`, `pr132`).

## 8. Điểm làm tốt

- #110: "thế nào là sửa giảm" nay chỉ định nghĩa ở một chỗ, cho cả danh sách lẫn số cảnh báo. `reporting` thôi đọc bảng audit. Thứ tự kiểm khớp từng chữ của hợp đồng. Xung đột với PR-B3 được gỡ sạch, không để lại bản sao.
- #131: mọi nơi gọi đều truyền `stay`, kể cả các đường thu tiền mới của #105. Mỗi cổng có đột biến riêng. Tỷ lệ ghim ở phía folio, không đụng ảnh chụp giá của `reservations`. BE-H tự nêu hai câu nghiệp vụ còn hở thay vì im lặng chọn.
- #123: guard và UnitOfWork dùng chung một hàm băm, tách ra tệp riêng. B13 gom đủ đêm ngoài khung mà vẫn giữ `date` cho client cũ. Oracle T14-7 thành bảng, dễ đối chiếu.

## 9. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC duyệt BE-H #110 @ `e870a1c9`, #131 @ `0594d165`, #123 @ `e9942779` (merge commit). Thứ tự gộp 110 → 133, 131 trước PR-M, 123 độc lập. Che hoa hồng trong audit (SEC 131-01 + ARC 131-01: cổng `audit/public/audit-visibility.ts`, áp cho `listAuditEvents` và `getReservationHistory`) làm PR riêng sau #110, gộp trước tag v1.0.5. Đổi người chốt (DOM 131-01 + ARC 131-02: đồng bộ hoa hồng khi PATCH; sau nhận phòng chỉ OWN, có `closerChangeReason` ở bổ sung 1h) làm ở `r5-h1c`, trước PR-M và 01/12 | ARC | rounds/round-05/reviews/ARC-on-be-h-prs-110-123-131.md |
