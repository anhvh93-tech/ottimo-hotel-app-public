# SEC – Review PR #110 (V5-16 PR-B2) và PR #131 (V5-30 `r5-h1b`), ý kiến về PR #123

Round 5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD SEC review | Gốc so sánh | CI lúc review |
|---|---|---|---|---|
| #110 (draft) | `r5-b2` | **`e870a1c9`** | `4920cd61` (merge-base với `main`) | shellcheck, "no test endpoints" xanh. Các job còn lại đang xếp hàng |
| #131 (draft) | `r5-h1b` | **`0594d165`** | `4920cd61` | test/build, API contract, OpenAPI lint, confidential paths, landing xanh. shellcheck đỏ ở bước `postgres-log-terse` (OPS-11, chập chờn đã biết). gitleaks, E2E smoke còn chạy |
| #123 (draft) | `r5-s1-tests` | **`e9942779`** | `4920cd61` | **gitleaks xanh**, OpenAPI lint, "no test endpoints" xanh. Các job còn lại đang chạy |

## Cách kiểm

- Đọc `gh pr view`, `gh pr diff` và tệp ở đúng SHA (`git show <sha>:<path>`, `git grep <sha>`). Không checkout bản làm việc chung, không push vào nhánh PR.
- Ba worktree tách riêng trong scratchpad của SEC, một PostgreSQL 17 tạm (container riêng, chỉ `127.0.0.1`, mật khẩu CI công khai của repo). Đã xóa cả hai sau review.
- Chạy lại test của PR (mục 1.6, 2.6, 3.5) và **một tệp probe chỉ trong scratchpad, không commit** (mục 2.3).
- Không gọi staging hay production. SEC không mở bảng tỷ lệ nội bộ. Tệp này không ghi tỷ lệ hay số tiền hoa hồng nào: chỉ nhắc tên giá trị thử `test_rate_short`. Không bí mật, không dữ liệu khách.
- Đối chiếu: `SEC-on-be-prs-101-108.md` (thẻ A31-01, V516-01…03, V530-02), `ARC-on-be-pr-101-h1.md` (H1-01…03), `ARC-on-be-pr-108-b1-filter.md` (B2-01, B1F-01), `DOM-on-be-prs-101-108-110.md`, `SEC-on-be-pr-103-s1.md` (S1-01, S1-03), `.github/gitleaks.toml`.

---

## 0. Kết luận

| PR @ SHA | Kết luận SEC | Điều kiện gộp | Thẻ mới |
|---|---|---|---|
| **#110 @ `e870a1c9`** | **DUYỆT** | Không | 110-01 (Suggestion) |
| **#131 @ `0594d165`** | **DUYỆT**, có điều kiện ở mức tag | Không chặn gộp. **131-01 (Major) phải xong trước khi cắt tag v1.0.5** | 131-01 (Major) |
| **#123 @ `e9942779`** | **DUYỆT** (phần SEC: guard, S1-03, `const KEY`) | Gộp bằng **merge commit** như mọi PR khác. Không squash, không rebase (mục 3.3) | 123-01 (Minor) |

0 Blocker · 1 Major · 1 Minor · 1 Suggestion.

Có commit mới chạm các tệp dưới đây thì SEC đọc lại phần chênh. Commit chỉ gộp `main` mà không chạm thì không cần.
- #110: `line-reduction.ts`, `line-reductions.ts`, `folio-lines.service.ts` `adjust`, `folio.controller.ts` `adjustFolioLine`, `attention-sources.ts`.
- #131: `parameters.service.ts`, `commission-keys.ts`, `folio.service.ts` `syncCommission` / `ensureCommission`.
- #123: `auth.guard.ts`, `request-hash.ts`.

Trạng thái thẻ cũ:

| Thẻ | Trạng thái sau review này |
|---|---|
| FB-R4-SEC-BE-A31-01 | **Chưa đóng.** Điều kiện (1) đạt về mã khi #110 gộp với CI xanh. Còn (2): #133 (`r5-v516-minibar`, phần tối thiểu V516-01), SEC review riêng. Còn (3): #108, #110, #133 lên cùng một tag |
| FB-R5-SEC-BE-V516-03 (Suggestion) | #110 chưa thêm `auditReason: 'A32'`. Giữ Open, để B-KYTHUAT |
| FB-R5-SEC-BE-V530-02 | Phần tham số **đạt** ở #131 (mục 2.1). **Chưa đóng**: đóng khi 131-01 xong |
| FB-R5-SEC-BE-S1-01 | Mã đúng đề xuất (mục 3.1). Đóng khi #123 gộp |
| FB-R5-SEC-BE-S1-03 | Có test (mục 3.2). Đóng khi #123 gộp |

ESC mới: **không**. Ghi chú cho ORC về đường lộ của 131-01 trên v1.0.4 ở mục 2.3.

---

## 1. PR #110 – chốt chặn BR-438, `line_reduction_count`, `entered_in_error`

### 1.1 Ai được giảm dòng – **Đạt**

- `x-roles` của `adjustFolioLine` gồm OWN, MGR, FDL, FD.
  - `limitedByBr438(roles)` đúng khi người gọi không có OWN/MGR và có FD/FDL. Vậy mọi người gọi không phải quản lý đều bị xét.
  - Tài khoản nhiều vai có MGR thì theo quyền MGR, đúng BR-438 (3).
- Thứ tự trong `FolioLinesService.adjust`:
  1. khóa folio (L1 → L3), kiểm `version`, `closed`, cửa sổ sau trả phòng;
  2. A32: folio `settled` thì chỉ MGR+;
  3. tải dòng, kiểm dòng thuộc folio (404);
  4. chặn BR-438;
  5. sau đó mới tới kiểm nợ, giá, số lượng.

  Lỗi ném trong UnitOfWork, nên giao dịch rollback, không ghi gì, khóa `Idempotency-Key` bị xóa.
- Phạm vi được giảm tính trên **dòng gốc** của chuỗi `related_line_id`: cùng `category`, không đi qua dòng đảo, tối đa 200 bước.
  - Dòng thay thế do người khác tăng không làm đổi chủ của dòng gốc (ca T16-9).
  - Không có đường nào để lễ tân "nhận" dòng của người khác làm dòng gốc của mình.
- `typedByHand` chỉ đúng với hai loại dòng: `source = manual` thuộc nhóm A30, hoặc `minibar_check` loại `minibar`.
  - SEC rà mọi chỗ ghi `source: 'manual'` trong `src`. Chỉ `addFolioLine` và dòng thay thế của `adjust` ghi dòng thuộc nhóm A30.
  - Dòng trả muộn (`late_checkout`), FOC, chênh đổi phòng không thuộc A30.
  - Các `source: 'manual'` ở `stay.service.ts` là nguồn giá đêm trong snapshot. Ở `housekeeping.service.ts` là nguồn việc buồng. Cả hai không phải dòng folio.
- Dòng đêm nằm ngoài BR-438 (vẫn theo biên A31).
- Thân 403: `FORBIDDEN_ACTION`, `detail` cố định, `requiredFlow: foc_request`. Không có số tiền, không có 4 dữ kiện phạm vi.
- `access.denied`:
  - ghi trong giao dịch riêng, sau rollback;
  - `entityType: operation`, `entityId: adjustFolioLine`, `reason: BR-438`;
  - `after` chỉ có `{ operationId, roles }`. Không có id dòng, không có số tiền.

  Đúng mẫu của guard.
- Các đường khác làm nhỏ dòng phát sinh:
  - đổi giờ trả muộn B15/B13: dòng tính theo giờ, có audit riêng của B15. Đây là luồng nghiệp vụ, như đêm đi theo B7/B8;
  - đếm lại minibar: thẻ V516-01, PR #133.

  #110 không mở thêm đường nào.

### 1.2 Cổng `audit/public/line-reductions.ts` – **Đạt**

- `countLineReductionsByActor` chỉ trả `{ actorUserId, n }[]`.
- Câu SQL chỉ đọc `property_id`, `occurred_at`, `actor_user_id`, `category`, `action`, và các khóa allowlist `before.actorRole`, `before/after.amountVnd`, `after.category`.
  - Không đọc `ip_hmac`, id phiên, `reason`, `entity_code` hay chữ tự do.
  - Số tiền chỉ nằm trong `WHERE`, không được trả ra.
- Mọi giá trị đi qua tham số `$n`, kể cả ngưỡng ở `HAVING`. `alias` là hằng trong mã. Không có SQL injection.
- Hàm chạy trong giao dịch read-only của người gọi, RLS theo cơ sở. `propertyId` rỗng thì trả mảng rỗng.
- `REPORTING_READ_TABLES` không có `audit_event`, và `module-boundaries.test.ts` ghim điều này. Hàm đếm và bộ lọc `reductionsOnly` dùng **cùng** mệnh đề `lineReductionWhere` (ca B2-01: mỗi người, số đếm = số dòng của bộ lọc).

### 1.3 Mục "Cần chú ý" và link – **Đạt**

- `attentionAudience('foc_threshold')` = `OWNER_ONLY`, lọc ở máy chủ (ca T16-12).
- `params` = `{ check: line_reduction_count, count, max }`, qua allowlist và kiểm định dạng `assertAttentionParams`. Không có tên, không có số tiền.
- `link` = `/audit?reductionsOnly=true&month=YYYY-MM&actorUserId=<uuid>`. Đây là id nhân viên, không phải dữ liệu khách. Chỉ OWN thấy, và API vốn nhận tham số này. SEC đã chấp nhận ở `SEC-on-be-prs-101-108.md` mục 3.4, không đổi.
- Ghi nhận: nguồn này được **tính cho mọi người gọi** `listAttentionItems`, kể cả FD, rồi mới lọc theo vai. Kết quả không ra ngoài, nhưng xem thẻ 110-01.

### 1.4 "Ghi nhầm" trên bill của khách – **Đạt**

- `guestFacing: true` ở `BillService` bỏ lý do `entered_in_error` khỏi nhãn dòng FOC/giảm giá trên bill.
- Hiện chưa ngữ cảnh nào truyền `reasonOf`, nên bill vốn không in lý do. `guestFacing` là lớp chặn thêm cho sau này. Không lộ thêm gì.

### 1.5 Dữ liệu trong test

Dùng tên giả: "Khách Thử B18", "Khách Thử BR438", món "Bia thử". Tên nhân viên Hạnh, Lan là tên trong ví dụ của DOM. Không có số điện thoại, email hay giấy tờ thật.

### 1.6 SEC chạy lại

6 tệp, **44/44 qua** trên PostgreSQL 17 tạm:
- `v5-16-line-reduction`, `v5-16-units`, `module-boundaries`;
- `integration/v5-16-br438-guard`, `integration/v5-16-br438-checkout`, `integration/ota-prepaid-flow`.

---

## 2. PR #131 – bản ghi hoa hồng ở mốc "đạt", ghim tỷ lệ, khóa hoa hồng chỉ OWN/MGR

### 2.1 Đọc và ghi tham số hoa hồng – **Đạt**

| Đường | Vai được | Vai khác | Bằng chứng |
|---|---|---|---|
| `listParameters` (`data`, `missing`) | OWN, MGR | FDL: không có tên khóa ở `data` hay `missing`. FD, HK, SAL, CTV: 403 ở guard (`x-roles`) | `hidden()` xét `COMMISSION_RATE_KEYS` **trước** ngoại lệ FDL. `missing` lấy từ cùng danh sách `visible` |
| `getParameterHistory` | OWN, MGR | FDL: 404 `NOT_FOUND` trước khi đọc dòng nào, giống khóa không tồn tại. Vai khác 403 ở guard | `if (!def \|\| hidden(def, roles)) throw problem('NOT_FOUND')` |
| `setParameter`, `cancelScheduledParameter` | **chỉ OWN** | MGR: 403 trước mọi kiểm giá trị (`edit_roles` = `{owner}`, migration 0002 dòng 138, không migration nào đổi). FDL và vai khác: 403 ở guard | `parameters.service.ts` `set`, `cancelScheduled` |

- Luật ghi chặt hơn "OWN/MGR" mà ORC nêu: MGR đọc được, không ghi được. Khớp DOM 4.4.
- `commissionTableIssue`: object đúng hai khóa `staff`, `collaborator`, mỗi khóa đi qua `pctIssue`. Sai thì 422 cho chính OWN vừa gửi, không lộ cho ai khác.
- Audit `config.changed` của khóa này do OWN ghi. FD/FDL chỉ thấy bản ghi của mình (`x-scope: own`), nên không thấy. MGR thấy, đúng quyền.
- SEC rà mọi câu `SELECT … FROM config_parameter` trong `modules/`. Ngoài `ParametersService`, chỉ `ParameterService.get` (nội bộ), `bill.service` (chỉ ngày hiệu lực) và tài khoản nhận tiền đọc bảng này. Không endpoint nào khác trả giá trị tham số.
  - `getBookingRules` (tham số cho form đặt phòng, giữ chỗ, báo giá) liệt kê từng khóa và không có khóa hoa hồng.
  - Trong `modules/`, chuỗi `short_stay_commission_pct` chỉ còn ở `commission-keys.ts`. Test quét mã của #131 ghim chỗ dùng hằng `SHORT_STAY_COMMISSION_KEY`, và chỉ `commission-rate.ts` đọc giá trị.
- `COMMISSION_RATE_KEYS` đã có sẵn `long_stay_commission` và `manager_performance_bonus_pct`, nên PR-M chỉ cần thêm vào danh mục. Phần bắt buộc của V530-02 cho `manager_performance_bonus_pct` vì vậy đã có sẵn.

### 2.2 Ghim tỷ lệ, `ensureCommission`, `confirmedStayOf` – **Đạt** (về bảo mật)

- `pinnedCommissionRate` lọc theo `reservation_id` **và** `payee_type`. Không bao giờ lấy tỷ lệ CTV cho sale hay ngược lại. Giá trị chỉ dùng trong `syncCommission`, không trả ra ngoài.
- `confirmedStayOf` dùng `SYSTEM_ACTOR` và RLS, không xét phạm vi vai. Chấp nhận được, vì:
  - kết quả chỉ dùng nội bộ để tạo bản ghi `commission`, hàm `tryEarnCommissions` chỉ trả về số lượng;
  - người gọi (thu tiền, đối soát, xóa nợ, B18) đã qua `x-roles` của thao tác tiền trên chính folio đó;
  - tỷ lệ do OWN đặt, nên người gọi không chọn được tỷ lệ có lợi cho mình bằng cách chọn lúc bấm.
- `ensureCommission` không đọc hay ghi dòng folio, chỉ chạy khi chưa có bản ghi nào khác `void`. Chạy lại không tạo bản ghi thứ hai (có test).
- **SAL/CTV không thấy hoa hồng hay tỷ lệ của người khác:**
  - `listCommissions`: phạm vi `own` cho `sales_staff`, `collaborator` nằm trong SQL (`payee_user_id` = người gọi);
  - `listAuditEvents`: SAL/CTV không có trong `x-roles`. Probe: SAL nhận 403;
  - báo giá: không đổi ở PR này (đã duyệt ở #101).

### 2.3 Đường đọc qua Nhật ký hoạt động (S27) – **Không đạt**, thẻ 131-01

**Probe** (chỉ trong scratchpad, chèn sau ca T-14-1 của `v5-30-commission-ensure.test.ts`, dữ liệu giả của test):
- FD vừa làm B18 gọi `GET /audit-events?action=commission.projected&action=commission.earned`.
- Kết quả: **200, 2 bản ghi của chính FD**.
  - `commission.projected`: `after` có `payeeType`, `ratePct` (= giá trị thử `test_rate_short`), `baseVnd`, `amountVnd`.
  - `commission.earned`: `after` có `amountVnd`.
- FDL chưa thao tác trên đơn này: 0 dòng. SAL: 403.

**Cơ chế** (đọc mã ở `0594d165`):
1. `AuditService.recordMoney` ghi `actor_user_id` là người gọi. `ensureCommission` trong `tryEarnCommissions` chạy với người đang trả phòng, thu tiền hay xóa nợ.
2. `listAuditEvents` cho FD/FDL xem `before`/`after` đầy đủ của **mọi** bản ghi có `actor_user_id` là mình (`audit-log.controller.ts` dòng 215–216). Không có lọc theo loại thực thể.
3. Allowlist `commission` (`folio/audit-entities.ts` dòng 80–87) gồm `ratePct`, `baseVnd`, `amountVnd`.
4. RLS của `audit_event` chỉ theo cơ sở, không theo vai.

**Phạm vi:**
- Lỗ này **có từ R2**, trên `main` và production v1.0.4:
  - `commission.earned` kèm `amountVnd` ở B18 do FD làm;
  - `commission.projected` kèm `ratePct` khi FD/FDL làm B13, PATCH đơn, đổi phòng (resync);
  - `folio.line_posted` / `folio.line_reversed` có `after.commissionVnd` cạnh `roomVnd` (`folio.service.ts` dòng ~2180). Có hai số này thì suy ra được tỷ lệ.
- #131 thêm ba mốc ghi `commission.projected` kèm `ratePct` dưới tên lễ tân: B18, thu nợ, xóa nợ. Mọi đơn chốt lúc thiếu tỷ lệ sẽ lộ tỷ lệ cho người trả phòng.
- Hệ quả: mục tiêu của H1-01 và V530-02 ("vai khác không thấy tỷ lệ") **chưa đạt**. Màn Tham số đã giấu, nhưng Nhật ký hoạt động của chính FD/FDL vẫn hiện tỷ lệ và tiền hoa hồng của sale/CTV. Như vậy trái SR-AZ-04, DOM 4.4 ("Vai khác: Không") và A60 (FDL ✖).

**Ghi chú cho ORC:**
- Theo DOM `rules-v1.0.5.md` mục 0 việc (4), chủ đầu tư nhập bảng thật ngay trên v1.0.4. Từ lúc đó, lỗ này lộ số thật cho FD/FDL đã làm các thao tác trên.
- Không cần chủ đầu tư quyết, và SEC **không** đề nghị chủ đầu tư hoãn nhập bảng (DOM đã nêu thiệt hại khi chậm).
- ORC nêu một câu trong `round-summary.md`: "đã biết, sửa ở v1.0.5".

### 2.4 G3: không có tỷ lệ hay tiền hoa hồng thật trong repo – **Đạt**

- Test mới chỉ dùng `test_rate_short`, `test_rate_short_2`. Đây là giá trị thử lẻ, cùng cặp #101 đã dùng (SEC đã chấp nhận). Số tiền trong test tính bằng `applyPct` trên giá trị thử.
- Tên ca test chỉ ghi tên biến, không có số.
- Mô tả PR và 4 commit (`305e3dcf`, `b0f00129`, `59c78efa`, `0594d165`) không có tỷ lệ hay số tiền hoa hồng.
- Phần thêm vào `src` không có `logger`/`console` mới, nên log không có số.
- Hằng `RATE_PARAM` thay cho tên có chữ KEY (`59c78efa`, quy ước gitleaks).
- Khách trong test là tên giả ("Khách Hoa Hồng"). Không có số điện thoại, email hay giấy tờ.

### 2.5 Ghi chú cho PR-M (không thẻ)

`manager_performance_bonus_pct` và bản ghi thưởng của quản lý:
- MGR xem `listAuditEvents` với phạm vi **toàn bộ**, nên sẽ thấy bản ghi thưởng của MGR khác nếu audit thưởng ghi số.
- Khi làm 131-01, nên làm luôn cách lọc cho thưởng: chỉ OWN và chính MGR đó thấy, như `getManagerPerformanceBonus` (`scope: manager own`).

### 2.6 SEC chạy lại

`integration/v5-30-commission-ensure.test.ts`: **9/9 qua**, cộng 1 ca probe ở mục 2.3. Tệp probe đã xóa cùng worktree.

---

## 3. PR #123 – S1 tests (thật ra có sửa mã)

#123 **không chỉ có test**. PR sửa 5 tệp `src`:
- `shared/http/auth.guard.ts` (`hasCompletedKey`);
- `shared/http/request-hash.ts` (mới);
- `shared/http/unit-of-work.ts` (export lại);
- `frontdesk/internal/stay.service.ts` (B13);
- `reservations/public/rate-out-of-range.ts`.

Hai tệp đầu là bản sửa thẻ S1-01 của SEC, nên SEC đọc kỹ. Phần B13 và `rateOutOfRange` thuộc ARC (S1-03, S1-01). SEC chỉ kiểm rằng phần đó không thêm khóa nào vào thân 403.

### 3.1 FB-R5-SEC-BE-S1-01 – **Đạt**, đóng khi #123 gộp

- `hasCompletedKey` nay so cả `request_hash`, cùng hàm `requestHash(method, pathOf(url), body)` mà `claimKey` và `completedReplay` dùng. Đường dẫn bỏ chuỗi truy vấn ở cả hai phía, nên hash luôn khớp với replay thật.
- Dùng lại một khóa đã xong với thân lệnh khác → guard trả 403 + `access.denied` ngay, trước mọi kiểm thân lệnh. Hai ca P1 trong `write-roles-gate` fail khi bỏ điều kiện này. Ca ADR-009 (replay cùng thân sau khi mất vai) vẫn xanh.
- Thân nhị phân (multipart) không bao giờ được coi là replay, nên trả 403.
  - BE nêu hệ quả: người đã mất vai gửi lại một lần upload với khóa đã xong sẽ nhận 403 thay vì bản replay.
  - SEC **chấp nhận**: đóng theo hướng an toàn, và lần upload gốc đã xong.
- `request-hash.ts` không import Nest, nên không có vòng phụ thuộc. `unit-of-work.ts` export lại hai hàm, không còn bản sao thứ hai.
- `hasCompletedKey` chỉ chạy trên đường **bị từ chối** (`!allowed`), nên việc băm thêm không tốn gì cho yêu cầu hợp lệ.

### 3.2 FB-R5-SEC-BE-S1-03 – **Đạt**

`createHoldFromQuote`, khi thân có trường giá:
- báo giá của mình, báo giá của SAL khác và UUID không tồn tại trả **cùng một** 422 (bỏ `requestId`);
- không có trường giá thì hai trường hợp sau trả 404.

Ca này đúng tinh thần probe P2.

### 3.3 `const KEY` trong `request-hash-guard-units.test.ts` – **chấp nhận để nguyên**

- Giá trị là một UUIDv7 bịa (`0190f5a4-…`), chỉ làm header `Idempotency-Key` trong unit test không có database. Khóa idempotency là id yêu cầu do client chọn, không phải thông tin đăng nhập. Giá trị này không hệ thống nào chấp nhận.
- `.github/gitleaks.toml` allowlist **đúng commit** `ae4a8358…` (SHA đầy đủ, có lý do). Allowlist không theo mẫu UUID, nên mọi giá trị giống vậy ở commit khác vẫn bị quét. Job gitleaks của #123 @ `e9942779` **xanh**.
- Đổi tên bây giờ thì vô hại, nhưng không được gì: `ae4a8358` nằm mãi trong lịch sử, nên allowlist vẫn cần. Các test mới của BE-H đã theo quy ước (`uuidv7()`, `RATE_PARAM`), nên không cần sửa.
- **Điều kiện:** gộp #123 bằng **merge commit**, đúng cách ORC đang gộp (`c981cee4`, `74189d2c` đều có 2 cha).
  - **Squash** tạo commit mới có dòng `const KEY = …` ở phần thêm, gitleaks sẽ đỏ trên `main`.
  - **Rebase** viết lại `ae4a8358` thành SHA khác, không còn trong allowlist.
  - Sửa dòng này về sau thì đổi tên hằng (vd. `IDEMPOTENCY_ID`) trong cùng commit.

### 3.4 Ghi nhận ngoài thẻ S1

- Thẻ 123-01 (Minor): guard ném lỗi 500 khi thân lệnh lồng sâu.
- `rateOutOfRange` với `legacyDate` chỉ thêm `date` (ngày đầu của `dates[]`) vào 422 của B13, cho người có quyền B13. Không lộ thêm biên của đêm khác. Đêm không có biên thì không có khóa `min`/`max`, không còn giá trị thay thế `MAX_SAFE_INTEGER`.

### 3.5 SEC chạy lại

8 tệp, **105/105 qua** trên PostgreSQL 17 tạm:
- `write-roles-units`, `request-hash-guard-units`, `rate-out-of-range-units`;
- `integration/write-roles-gate`, `v5-14-quote-qa-branches`, `v5-14-quote-typed-rates`, `v5-22-rate-bounds`, `bug-r4-038-internal-added-night`.

---

## 4. Thẻ feedback

### FB-R5-SEC-BE-131-01
- Mức độ: **Major**
  - Không chặn gộp #131.
  - Phải xong trước khi cắt tag v1.0.5.
  - Là điều kiện đóng FB-R5-SEC-BE-V530-02 và để ARC đóng FB-R5-ARC-BE-H1-01.
- Vị trí:
  - `product/services/api/src/modules/audit/internal/audit-log.controller.ts` `listAuditEvents`: nhánh `if (!full) where.push(e.actor_user_id = …)`, dòng 215–216 @ `0594d165`; phần map `before`/`after`, dòng 256–273;
  - `folio/audit-entities.ts` dòng 80–87 (allowlist `commission`) và dòng 14 (`folio.commissionVnd`);
  - `folio/public/folio.service.ts`: `syncCommission` (`commission.projected`), `tryEarnCommissions` (`commission.earned`), audit đồng bộ đêm (`after.commissionVnd`);
  - mốc mới của #131: `checkout.service.ts` (B18), `payments.service.ts` `tryEarn`, `foc.service.ts` `afterWriteOff`.
- Vấn đề:
  - FD/FDL đọc được tỷ lệ và tiền hoa hồng của sale/CTV trong Nhật ký hoạt động **của chính mình**. Mỗi thao tác của họ có kéo theo đồng bộ hoa hồng sẽ ghi một bản ghi audit dưới tên họ:
    - `commission.projected` có `ratePct`, `baseVnd`, `amountVnd`;
    - `commission.earned` có `amountVnd`;
    - `folio.line_posted` có `commissionVnd` cạnh `roomVnd`.
  - `listAuditEvents` cho FD/FDL xem trọn `before`/`after` của các bản ghi đó.
  - Probe mục 2.3: FD làm B18, rồi đọc được `ratePct` (giá trị thử) và tiền hoa hồng của đơn. SAL bị 403.
  - Lỗ có từ R2. #131 thêm ba mốc (B18, thu nợ, xóa nợ) ghi `ratePct` dưới tên lễ tân.
- Vì sao quan trọng:
  - Bảng tỷ lệ là bảng nội bộ chủ đầu tư giữ kín (G3, FB-R4-SEC-BE-01). DOM 4.4, SR-AZ-04 và A60 nói FD/FDL không xem hoa hồng.
  - ARC xếp việc FDL đọc bảng qua màn Tham số là Major (H1-01). Đường này cho **cả FD** đọc cùng số, tức H1-01 mới chặn được một nửa.
  - Chủ đầu tư nhập bảng thật trên v1.0.4, nên lỗ này đang mở trên production.
  - Mức rủi ro SEC: **Medium**. Chỉ nhân viên nội bộ đã đăng nhập; không có dữ liệu khách; không chuyển được tiền.
- Đề xuất sửa (không migration, không đổi schema; khoảng 0,25 ngày):
  1. Trong `listAuditEvents`, khi người gọi **không** có OWN/MGR (`!full`):
     - thêm `e.entity_type IS DISTINCT FROM 'commission'` vào `WHERE`. FD/FDL không còn thấy `commission.projected`, `commission.earned`, `commission.voided`;
     - khi map kết quả, bỏ khóa `commissionVnd` khỏi `before`/`after` của mọi bản ghi. Dùng một hằng `COMMISSION_AUDIT_FIELDS`, đặt ở `audit/public` để PR-M thêm khóa thưởng.

     Lọc lúc đọc, không đổi cách ghi: OWN/MGR vẫn đọc đủ, và dữ liệu audit đã ghi trên production cũng được che.
  2. Test tích hợp:
     - FD làm B18 trên đơn có sale chốt, đã có tỷ lệ. Sau đó `GET /audit-events?action=commission.projected&action=commission.earned` rỗng;
     - mọi bản ghi `folio.line_posted` FD đọc được không có `commissionVnd`;
     - FDL thu nợ sau trả phòng, kết quả như FD;
     - MGR và OWN vẫn thấy đủ các bản ghi trên.

     Thử đột biến: bỏ điều kiện thì ca FD đỏ.
  3. ARC thêm vào PR chữ hợp đồng kế tiếp (cùng câu H1-01) cho `listAuditEvents`: "FD/FDL không thấy bản ghi hoa hồng và khóa `commissionVnd`".
  4. PR-M: bản ghi thưởng của quản lý chỉ OWN và chính MGR đó thấy (mục 2.5).
  5. Chỗ làm:
     - BE-H làm trong #131 (cùng làn hoa hồng), **hoặc** một PR nhỏ riêng. Cách nào cũng phải gộp trước khi cắt tag;
     - `audit-log.controller.ts` cũng bị #110 sửa (import `lineReductionWhere`). Nên làm sau khi #110 gộp, hoặc gộp `main` trước khi sửa, để tránh xung đột;
     - ORC chọn người làm.
- Trạng thái: Open

### FB-R5-SEC-BE-123-01
- Mức độ: **Minor**. Không chặn gộp #123. Làm trong v1.0.5 nếu tiện, không thì B-KYTHUAT.
- Vị trí: `product/services/api/src/shared/http/request-hash.ts` `canonicalJson`, `requestHash` (tệp mới của #123); `auth.guard.ts` `hasCompletedKey`. Cùng hàm còn được gọi ở `unit-of-work.ts`, `guest-unit-of-work.ts`, `public-booking.service.ts`.
- Vấn đề:
  - `canonicalJson` (và `withoutSecrets`) đệ quy, không giới hạn độ sâu. Bộ đọc JSON của Fastify (`secure-json-parse`, duyệt lặp) nhận được thân lồng sâu.
  - SEC thử riêng cùng thân hàm: mảng lồng khoảng 5.000 tầng, tức khoảng 10 KB, làm `canonicalJson` ném `RangeError`.
  - Từ #123, guard băm thân lệnh trên đường bị từ chối. Một người không có quyền gửi thân như vậy, kèm một UUID làm `Idempotency-Key`, sẽ nhận **500**, không nhận 403. Guard cũng không ghi `access.denied`.
  - Chú thích của PR nói "never a 422 / 500 from the guard". Đường cho người có quyền (UnitOfWork) đã có hành vi 500 này từ trước.
- Vì sao quan trọng:
  - Một lần thử trái quyền có chủ ý thì không để lại dấu trong nhật ký từ chối.
  - Người dùng đã đăng nhập (nhân viên, khách có phiên) tạo được lỗi 500 hàng loạt. Việc đó làm nhiễu cảnh báo lỗi của OPS.
  - Không lộ dữ liệu, không sai tiền.
- Đề xuất sửa:
  1. Trong `request-hash.ts`: giới hạn độ sâu khi duyệt, ví dụ quá 32 tầng thì ném `problem('VALIDATION_FAILED', { detail: 'Request body nested too deep' })`. Một chỗ sửa cho mọi nơi gọi.
  2. Trong `hasCompletedKey`: bọc `requestHash` bằng `try/catch`, lỗi thì `return false`. Guard khi đó luôn trả 403 + `access.denied`, đúng chú thích.
  3. Thêm 2 ca unit vào `request-hash-guard-units.test.ts`:
     - thân lồng 10.000 tầng, vai bị từ chối → guard trả `false` (không ném);
     - `requestHash` với thân đó → 422.
- Trạng thái: Open

### FB-R5-SEC-BE-110-01
- Mức độ: Suggestion. B-KYTHUAT, không gắn tag.
- Vị trí: `product/services/api/src/modules/events/internal/attention.service.ts` dòng 92–96 (tính mọi nguồn rồi mới lọc theo vai); `reporting/internal/attention-sources.ts` `focThreshold`; `events/public/events.service.ts` `AttentionSourceContext` (không có `roles`).
- Vấn đề:
  - Nguồn chỉ dành cho OWN (`foc_threshold`, nay có thêm số đếm sửa giảm theo người) vẫn **chạy** trong yêu cầu của FD/FDL/MGR mỗi lần Desk tải "Cần chú ý". Kết quả bị lọc bỏ sau đó.
  - Không lộ gì hôm nay. Nhưng dữ liệu theo người của nhân viên khác được tính trong ngữ cảnh của người không được xem. An toàn chỉ còn dựa vào một lớp (`attentionAudience`).
- Vì sao quan trọng: phòng thủ nhiều lớp. Truy vấn `GROUP BY` trên audit tiền của cả tháng cũng không nên chạy ở mỗi lần FD tải trang.
- Đề xuất sửa: thêm `roles` vào `AttentionSourceContext`. Các nguồn chỉ cho OWN (hoặc MGR+) trả `[]` khi người gọi không thuộc nhóm đó. `attentionAudience` giữ nguyên làm lớp thứ hai.
- Trạng thái: Open

---

## 5. Điểm làm tốt

- #110: số đếm "Cần chú ý" đi qua một cổng trả đúng `{ actorUserId, n }`, dùng chung mệnh đề với bộ lọc. `reporting` thôi đọc bảng `audit_event` (có `ip_hmac`, id phiên, chữ tự do), và có test ranh giới module giữ điều này. Bản ghi `access.denied` của BR-438 không mang số tiền hay id dòng.
- #131: khóa hoa hồng được xét **trước** mọi ngoại lệ FDL. Lịch sử trả 404 như khóa không tồn tại. Tập khóa có sẵn hai khóa của PR-M. Test chỉ dùng giá trị thử, kèm thử đột biến cho từng cổng.
- #123: guard dùng **cùng** hàm băm với UnitOfWork, tách ra tệp riêng nên không có vòng phụ thuộc. Đã thử đột biến điều kiện `request_hash`. Test mới theo quy ước gitleaks (`uuidv7()`), không có hằng KEY mới.

## 6. Phạm vi và giới hạn

- SEC không review phần nghiệp vụ: BR-438-04, `carryToCheckout`, ghim tỷ lệ theo BR-903 (5), B13 `dates[]`. Các phần đó thuộc ARC, DOM, QA.
- Worktree, tệp probe và container PostgreSQL tạm nằm trong scratchpad của SEC, đã xóa sau review. Không commit gì vào `r5-b2`, `r5-h1b`, `r5-s1-tests`.
- SEC không approve hay gộp trên GitHub. ORC gộp.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – review BE-H: #110 @ e870a1c9 DUYỆT; #131 @ 0594d165 DUYỆT (ĐK tag); #123 @ e9942779 DUYỆT (gộp bằng merge commit).** #110: BR-438 chặn mọi vai không phải OWN/MGR, xét trên dòng gốc (A30 hoặc minibar_check, chính người gọi, trong ngày nghiệp vụ), 403 + requiredFlow không số tiền, access.denied không id dòng/số tiền; cổng audit/public/line-reductions chỉ trả {actorUserId, n}, reporting không đọc audit_event; foc_threshold line_reduction_count chỉ OWN, params không tên/tiền, link chỉ id nhân viên; 44/44 test. #131: khóa hoa hồng chỉ OWN/MGR đọc (FDL không tên, lịch sử 404), chỉ OWN ghi (edit_roles owner); SAL/CTV chỉ thấy bản ghi của mình; G3 đạt (chỉ test_rate_*); thẻ **131-01 Major** (FD/FDL đọc tỷ lệ và tiền hoa hồng trong nhật ký hoạt động của chính mình – commission.projected/earned, folio.line_posted.commissionVnd; có từ R2, #131 thêm mốc B18/thu nợ/xóa nợ; sửa: listAuditEvents lọc entity commission và khóa commissionVnd khi không OWN/MGR, trước tag v1.0.5; V530-02 và H1-01 chưa đóng tới khi xong). #123: S1-01 và S1-03 đạt; const KEY để nguyên (allowlist đúng commit ae4a8358, gitleaks xanh; không squash/rebase); 123-01 Minor (thân lồng sâu → 500 ở guard, không access.denied). 110-01 Suggestion (nguồn chỉ OWN vẫn tính cho FD). A31-01 chưa đóng: chờ #133 + cùng tag. Không ESC | SEC | rounds/round-05/reviews/SEC-on-be-h-prs-110-131.md |`
