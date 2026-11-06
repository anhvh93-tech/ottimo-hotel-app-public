# SEC – Review PR #101 (V5-30) và PR #108 (V5-16 phần lọc), ý kiến cho PR #110

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:
- **PR #101**, nhánh `r5-h1`, HEAD **`02d8e27a`** (merge `main` @ `ab1fc4ae`, không rebase). CI của HEAD xanh: `format · lint · audit · test · build`, gitleaks, `confidential paths`, API contract (RBAC `--strict`), OpenAPI lint, E2E smoke. GitHub báo `MERGEABLE / CLEAN` với `main` hiện tại.
- **PR #108**, nhánh `r5-b1-filter`, HEAD **`b5f60440`** (1 commit). CI xanh như trên, `MERGEABLE / CLEAN`.
- **PR #110** (draft, `r5-b2`, HEAD `c71ae350`, xếp trên #108): SEC chỉ trả lời 3 điểm BE-H nêu, không review toàn bộ.

Cách làm:
- Đọc `gh pr view`, `gh pr diff` và tệp ở đúng SHA bằng `git show <sha>:<path>` / `git grep <sha>`. Không checkout bản làm việc chung, không chạy test, không gọi staging hay production.
- Đối chiếu mã có sẵn trên `main` @ `18bdd279`: `platform/internal/parameters.service.ts` (`hidden`, `canSeeRestricted`), `folio/internal/folio-lines.service.ts` `adjust`, `inventory/internal/minibar.service.ts` `record`, `folio/public/folio.service.ts` `reverseLine`, `shared/http/auth.guard.ts` `enforce`.
- Đối chiếu tài liệu: hợp đồng 0.3.13 mục 1.5, 1.10, 1.20, 1.24 (`rounds/round-05/outputs/ARC/contract-0.3.13.md`, `product/docs/api/openapi.yaml`), DOM `rules-v1.0.5.md` mục 3 và 4, EP00 mục 5.1, SR-AZ-01, thẻ cũ FB-R4-SEC-BE-01, FB-R4-SEC-ORC-01 (G3), FB-R4-SEC-BE-A31-01.
- SEC **không mở** bảng nội bộ 01/11 và không ghi tỷ lệ hay số tiền hoa hồng nào vào tệp này. Không có bí mật hay dữ liệu khách.

---

## 0. Kết luận

| PR | Kết luận SEC | Điều kiện gộp |
|---|---|---|
| **#101** @ `02d8e27a` | **DUYỆT** | Không. 0 Blocker · 0 Major · 2 Minor (không là điều kiện gộp) |
| **#108** @ `b5f60440` | **DUYỆT** | Không. 0 Blocker · 0 Major (của riêng #108) · 1 Suggestion |

- Có commit mới chạm `commission-rate.ts`, `parameters.service.ts`, `quote-pricing.ts` (#101) hoặc `audit-log.controller.ts`, `audit-entities.ts`, `folio-lines.service.ts` (#108) thì SEC đọc lại phần chênh trước khi gộp. Gộp `main` vào nhánh mà chỉ giải xung đột `boolQuery` với #105 thì không cần.
- **FB-R4-SEC-BE-A31-01: chưa đóng.** #108 mới là phần lọc và khóa audit. Đóng khi đủ 3 điều kiện ở mục 2.4.
- Thẻ mới về đường đếm lại minibar (FB-R5-SEC-BE-V516-01, **Major**) không chặn gộp #108 hay #110, nhưng là điều kiện đóng A31-01 và phải xong trước tag v1.0.5.
- Câu hỏi của ORC về `ds-e.json` và oracle BR-903-01: **không cần đổi sang giá trị giả khi #101 gộp** (mục 1.5).
- ESC mới: **không**.

---

## 1. PR #101 – V5-30: `commission.status`, `listParameters.missing[]`, bỏ tỷ lệ khỏi code

### 1.1 Không còn tỷ lệ hoa hồng sale/CTV trong phần PR thêm vào – **Đạt**

- `production-defaults.ts`: bỏ hàng `short_stay_commission_pct` và 10 cột `commissionStaffPct`/`commissionCollaboratorPct` của `lease_terms`. `short_stay_commission_pct` chuyển sang `INV_ENTERS_KEYS`. Các số chỉ còn ở dòng **bị xóa** của diff, và đó là số cũ ESC-005 đã có trong lịch sử git (decision-log 04/11: số cũ không coi là bí mật, `[GIẢ ĐỊNH – chờ INV xác nhận]`).
- Code tại `02d8e27a`:
  - `git grep` trong `src` (trừ `db/migrations/`) không còn `commission(Staff|Collaborator)Pct`;
  - chỉ `folio/public/commission-rate.ts` nhắc tên khóa `short_stay_commission_pct` trong `modules/`;
  - migration `0002` chỉ khai danh mục khóa, `default_value` = `NULL`.
- Còn trong `production-defaults.ts`:
  - phí kênh OTA (BR-901, dòng 156–173): ngoài phạm vi G3, vì G3 nói về hoa hồng sale, CTV và thưởng;
  - `commission_payable_day`, `commission_pay_by_day`: ngày trong tháng, không phải tỷ lệ;
  - `max_open_holds_per_user`: số lượt giữ chỗ, không phải tỷ lệ.
- Test mới (`v5-30-commission-rate.test.ts`, `integration/v5-30-commission-status.test.ts`): chỉ dùng `test_rate_short` = 1,37 và `test_rate_ctv` = 2,41, dữ liệu `@example.test`. T30-4 kiểm theo **tên khóa**, không kiểm theo số, nên test không phải chứa danh sách số. Hai ca quét mã giữ được quy tắc này về sau.
- Mô tả PR và thông điệp commit (`git log main..02d8e27a`) không có tỷ lệ hay số tiền hoa hồng.
- `test/integration/sales.test.ts`: PR chỉ thêm dòng `status: 'computed'` vào ca cũ BR-903-01. Ca này dùng tỷ lệ cũ của DS-E và tên ca có số cũ. Đây là ca cũ có sẵn, đúng FB-R4-SEC-DOM-01 ("với ca cũ, cả hai cách đều đạt"), không phải ca mới của H2. Không thẻ.

### 1.2 `rate_missing` không lộ tỷ lệ hay số tiền cho SAL/CTV – **Đạt**

- `commission-rate.ts` chỉ bắt `ParameterMissingError` → `rate_missing`. Lỗi khác vẫn ném lên, có test "connection lost". Không có số mặc định ở đâu.
- `commissionPctFor` siết thêm: không nhận mảng và giá trị > 100. Bảng hỏng thì ra `rate_missing`, không bao giờ ra số lạ.
- `quote-pricing.ts:372–423`, khi `rate_missing`:
  - `commission = { status, ruleRef }`, không có `ratePct`, `baseVnd`, `amountVnd`;
  - `ottimoRemainingVnd = totalVnd`, không suy ra được gì;
  - `quote.commission_vnd` để `NULL`;
  - snapshot (dòng 468) chỉ có `{ payeeType, status, ruleRef }`.
- Test tích hợp T30-1/T30-5:
  - SAL và CTV nhận đúng `{ status: 'rate_missing', ruleRef: 'BR-903' }`;
  - CTV không có `ottimoRemainingVnd`;
  - FD/FDL không có object `commission` (SR-AZ-04);
  - `/commissions` rỗng, không có dòng `commission` nào được tạo;
  - không có 500.
- `folio.service.ts:3987`: thiếu tỷ lệ thì không tạo dòng `commission` và không ghi 0. Tỷ lệ 0 do OWN nhập vẫn `computed` (ARC đã ghi).
- Trạng thái `rate_missing` chỉ cho người xem biết OWN chưa nhập bảng. Đây không phải dữ liệu nhạy cảm.

### 1.3 `missing[]` không lộ tên khóa cho vai không được xem – **Đạt**

- `parameters.service.ts:129–162`: `missing[]` lấy từ **cùng** danh sách `visible` với `data`, tức đã qua `hidden()` (khóa bảo mật/`SR-`) và `ownerOnlyKey()` (`payment_receiving_account`). Trường chỉ có mặt khi `canSeeRestricted` (OWN, MGR). Khớp `x-visible-to: [owner, manager]` trong hợp đồng.
- Bỏ điều kiện `WHERE c.key IS NOT NULL OR d.default_value IS NOT NULL` khỏi SQL rồi lọc bằng `has()` trong mã cho kết quả tương đương với `data`. Chỉ trả tên khóa, không giá trị, không người sửa.
- Test T30-3:
  - MGR không thấy `payment_receiving_account` trong `missing`;
  - FDL không có trường `missing`;
  - FD bị 403;
  - không khóa nào vừa ở `missing` vừa ở `data`.
- Ghi nhận ngoài PR (thẻ V530-02): FDL vẫn đọc được **giá trị** `short_stay_commission_pct` trong `data`, vì khóa này không thuộc nhóm hạn chế (EP00 5.1: OWN, MGR, FDL xem). Không do #101 gây ra.

### 1.4 Production vẫn giữ hàng cũ (thẻ V530-01)

PR và hợp đồng đều ghi: bỏ số khỏi `production-defaults.ts` chỉ có tác dụng với một lần bootstrap mới, vì bảng append-only.

Hệ quả trên production hiện tại:
- hàng `short_stay_commission_pct` cũ vẫn còn hiệu lực;
- báo giá và hoa hồng tiếp tục tính theo tỷ lệ cũ (hết hiệu lực từ 01/11) cho tới khi OWN nhập hàng mới;
- `missing[]` **không** liệt kê khóa này, nên Desk không hiện "Chưa có tỷ lệ hoa hồng";
- lớp chặn duy nhất là việc (3) trong danh sách INV tự nhập trên Desk (`rules-v1.0.5.md` mục 0, `esc-pending-06-11.md` dòng 8), hạn trước kỳ chốt 01/12.

Đây là rủi ro sai tiền đã nêu ở FB-R4-SEC-BE-01 ("vì sao quan trọng" ý 2). Cần một bước kiểm không lộ số (thẻ V530-01).

### 1.5 `ds-e.json` dòng ~1287 và oracle BR-903-01: **không cần đổi khi #101 gộp**

- Số trong hai chỗ này là tỷ lệ cũ ESC-005. Cả hai đã có nhãn hết hiệu lực:
  - `ds-e.json`: `note` "Ví dụ theo tỷ lệ cũ ESC-005 (trước 01/11 – hết hiệu lực)…";
  - `br-examples.json` BR-903-01…04, BR-326-01: `supersededBy` + `validUntil: 2026-10-31`.
- Số này đã có trong lịch sử git. Thay bằng giá trị giả bây giờ không giảm rủi ro nào, mà làm đứt chuỗi oracle (BR-903-01…04, BR-326-01, `sales.test.ts`) và thêm việc cho QA.
- DS-E chỉ nạp cho dev, test và staging:
  - `seed-cli.ts` chặn khi `APP_ENV` khác `dev|test|staging`;
  - `bootstrap-vps.sh` chỉ cài tệp cho `staging`;
  - production dùng `production-defaults.ts`.
- Vì vậy ảnh chụp SAL/CTV ở staging hiện số tiền tính theo tỷ lệ cũ, không theo bảng thật. G4 không bị ảnh hưởng.
- Quy tắc giữ nguyên:
  - **không ai "cập nhật" các dòng này sang số mới** (R1);
  - ca mới về hoa hồng (PR-M: `long_stay_commission`, `manager_performance_bonus_pct`) chỉ dùng `test_rate_*`, hoặc để trống để kiểm `rate_missing` (G3).
- Nếu INV trả lời rằng số cũ cũng là bí mật, việc phải làm là phương án B của `SEC-on-commission-numbers.md` mục 4, không phải sửa hai tệp này.

---

## 2. PR #108 – V5-16 phần lọc `listAuditEvents` và khóa audit dòng gốc

### 2.1 Lọc jsonb không mở đường vượt phạm vi – **Đạt**

`audit-log.controller.ts` @ `b5f60440`:

- Mọi điều kiện ghép bằng `AND` (`where.join(' AND ')`). Phạm vi viết trước các bộ lọc:
  - `e.property_id` (OWN thêm bản ghi cấp tổ chức);
  - `if (!full) e.actor_user_id = <người gọi>` (dòng 185).

  Các bộ lọc mới chỉ thêm `AND`, nên **chỉ thu hẹp** kết quả. FD/FDL gửi `actorUserId` thì bị bỏ qua, có test T16-3: FD gửi id của MGR vẫn chỉ ra bản ghi của mình. Số bản ghi FD thấy bằng số bản ghi trong bảng có `actor_user_id` = FD.
- Mọi giá trị người dùng gửi đều đi qua tham số `$n`:
  - `action = ANY($n::text[])`;
  - `ROOM_MONEY_CATEGORIES` cũng được truyền dưới dạng tham số `text[]`.

  `amountOf(side)` chỉ ghép chuỗi hằng `'before' | 'after'` từ mã, không có đầu vào người dùng. Không có SQL injection.
- `actionQuery`:
  - kiểm pattern và độ dài trước khi dùng;
  - giá trị không phải chuỗi (object, mảng lồng) → 422;
  - tối đa 10 mã, bỏ mã trùng.

  `boolQuery` chỉ nhận `true`/`false`; giá trị lặp (mảng) → 422.
- So jsonb an toàn: chỉ ép `::numeric` khi `jsonb_typeof = 'number'`. Không gây được lỗi 500 bằng dữ liệu lạ trong bảng.
- Không có kênh suy luận: bộ lọc chỉ xét `before/after.amountVnd`, `after.category`. Các trường này đã nằm trong allowlist và đã hiện trong phản hồi cho người được xem dòng đó. FD không dùng bộ lọc để "dò" dòng ngoài phạm vi được, vì dòng ngoài phạm vi đã bị loại trước.
- Tải: hai bộ lọc ghim `category = money` + `action = folio_line.adjusted`, khoảng ngày ≤ 92, có `limit`. QA chạy `EXPLAIN` trên staging theo C0313-20 ý 4 là đủ.

### 2.2 Allowlist `folio_line` không lộ thêm – **Đạt**

- Thêm 4 khóa:
  - `postedByActor`, `sameBusinessDay`, `rootLineManual` (đúng/sai);
  - `rootLineId` (uuid của một dòng trong cùng folio).

  Không có số tiền, tên người hay chữ khách gõ. `actorRole` đã có từ FB-R3-SEC-BE-B-03.
- Người đọc được các khóa này là người đã thấy dòng audit đó:
  - FD/FDL: bản ghi của chính mình;
  - MGR/OWN: mọi bản ghi.

  Họ vốn đã thấy folio và các dòng của nó. HK, SAL, CTV không gọi được `listAuditEvents` (`x-roles` trong hợp đồng).
- `lineOrigin` (dòng 135):
  - CTE đệ quy chạy trong giao dịch có RLS theo cơ sở;
  - chỉ đi theo `related_line_id` cùng `category`, bỏ dòng đảo;
  - giới hạn 200 bước, nên không lặp vô tận.

  Hàm chỉ đọc, chạy sau khi đã kiểm dòng thuộc folio.
- `v5-16-units.test.ts` ghim allowlist bằng `pickAuditFields`: khóa lạ (`description`) bị bỏ. Đúng SR-AUD-03.

### 2.3 Sửa kèm: bỏ dòng trên folio đang mở nay ghi `folio_line.adjusted` – **Đạt, nên có**

- Trước #108, `voidLine` và `newQuantity: 0` trên folio mở chỉ ghi `folio.line_reversed`, nên không có trong "Bỏ/giảm dòng". Đây đúng là ca chính của A31-01.
- Nay nhánh `else if (folio.status !== 'settled')` (dòng 726) ghi thêm một `folio_line.adjusted` với `after.amountVnd = 0`. `folio.line_reversed` giữ nguyên.
- SEC đã kiểm 6 nhánh (mở/đã thanh toán × tăng/giảm/bỏ × có/không có nợ). Mỗi lần sửa ghi **đúng một** `folio_line.adjusted`, không trùng.
- `actorRole` ở hai nhánh A32 cũ vẫn tính bằng `actorRoleOf(actor.userId, actor.roles)` như trước. Không đổi nghĩa.
- `reason` là chữ nhân viên gõ, nay có thêm ở một bản ghi nữa. Trước đó nó đã nằm trong `folio.line_reversed` của cùng lần sửa, nên không lộ thêm.

### 2.4 FB-R4-SEC-BE-A31-01: **chưa đóng**

Thẻ gốc: FD/FDL bỏ hoặc giảm về 0 mọi dòng phát sinh không phải dòng đêm mà không ai duyệt. #108 chỉ lo phần "thấy được": bộ lọc và khóa audit. Phần "chặn" (đề xuất (a), DOM chọn BR-438) nằm ở #110.

SEC đóng thẻ khi đủ 3 điều kiện:
1. #110 gộp, CI xanh, có các ca T16-5…T16-10. FD/FDL ngoài phạm vi → 403 + `requiredFlow: foc_request`, không ghi gì, có một `access.denied`. SEC review #110 khi chuyển ready.
2. Xong phần tối thiểu của **FB-R5-SEC-BE-V516-01** (đường đếm lại minibar). Đây là một đường thứ hai để giảm dòng phát sinh không qua BR-438, nên vẫn thuộc "Vấn đề" của thẻ gốc.
3. Hai PR lên cùng một tag production (FB-R5-SEC-BE-V516-02).

Danh sách đóng ca (`ShiftReport.lineReductions[]`) hoãn sang v1.0.6 không cản việc đóng thẻ. Khi đã có chặn (a), báo cáo theo ca chỉ là lớp xem lại thêm (DOM 7.2 ý 4, US-177 AC7 (iii)).

---

## 3. Ý kiến SEC về 3 điểm BE-H nêu ở PR #110

### 3.1 Đếm lại minibar giảm được dòng minibar mà không qua `adjust` – **phải xử lý** (thẻ V516-01, Major)

- `minibar.service.ts` `record` (R7, dòng 472, `main` @ `18bdd279`): số đếm mới khác số cũ thì máy chủ đảo dòng minibar đang sống (`reverseLine`, lý do `minibar_recount`), rồi ghi một dòng mới theo số mới. Dòng mới có thể nhỏ hơn, hoặc không có nếu đếm "không dùng gì".
- `recordMinibarCheck` mở cho OWN, MGR, FDL, FD, HK (A37):
  - vai Desk không bị giới hạn ngày (`stay()`), chỉ cần đơn `in_house`;
  - chặn duy nhất là 409 khi việc bổ sung tủ đã xong.
- Kết quả: FD/FDL làm được đúng việc BR-438 cấm, qua một đường khác:
  - giảm hoặc bỏ dòng minibar HK hay FD khác đã đếm;
  - giảm dòng mình đếm từ ngày trước.

  DOM 3.3 lấy chính ví dụ minibar ("Lan ca sau sửa dòng Hạnh ghi → bị chặn, gửi FOC"). Theo đường đếm lại, Lan làm được mà không cần FOC.
- Dấu vết còn lại:
  - `minibar_check` (`checked_by`, `replaces_check_id`);
  - `folio.line_reversed` có lý do `minibar_recount`.

  Không có `folio_line.adjusted` nào được ghi, nên lần giảm này không có trong `removalsOnly`, `reductionsOnly` hay `line_reduction_count`. Quản lý chỉ tìm được bằng `action=folio.line_reversed` rồi đọc lý do từng dòng.
- Mức rủi ro: **Medium**. Mỗi lần số tiền nhỏ, nhưng minibar là khoản phát sinh hay thu tiền mặt nhất, và đường này phá hẳn BR-438 cho cả một loại dòng.
- DOM/QA nên kiểm thêm một điểm SEC chưa chắc: số đếm thấp hơn thực tế có làm việc bổ sung tủ thiếu, rồi khách sau bị tính món khách trước dùng không.
- Đề xuất: xem thẻ V516-01. Không chặn gộp #108 hay #110, vì cả hai chỉ siết thêm.

### 3.2 403 A32 (FD sửa folio đã thanh toán) không ghi `access.denied` – **chấp nhận giữ nguyên cho v1.0.5** (thẻ V516-03, Suggestion)

- SR-AZ-01 chỉ bắt buộc ghi `access.denied` khi **vai không có trong `x-roles`**, và guard đã làm việc đó (`auth.guard.ts` `enforce`). A32 là luật theo trạng thái folio, nằm trong handler (`folio-lines.service.ts:522` trên `main`). Lần bị chặn không đổi tiền, nên không trái yêu cầu nào.
- `access.denied` của BR-438 có giá trị vì nó là dấu hiệu thất thoát (thử giảm dòng ngoài phạm vi). Một FD sửa folio sau trả phòng cũng gần với dấu hiệu đó, nhưng hay gặp ca thật (sửa muộn rồi nhờ quản lý).
- #110 đã bọc controller bằng `try/catch` cho BR-438, nên thêm `auditReason: 'A32'` chỉ tốn vài dòng. SEC khuyên làm nếu tiện, không bắt buộc.

### 3.3 Audit cũ không có `before.actorRole` không vào `line_reduction_count` – **chấp nhận**

- Trước 0.3.13:
  - `folio_line.adjusted` trên folio mở không có `actorRole`;
  - bỏ dòng trên folio mở không ghi `folio_line.adjusted` (mục 2.3).

  Nên dữ liệu cũ vốn đã thiếu.
- Đoán vai từ `user_property_role` hiện tại có thể gán sai: người đã đổi vai sẽ bị tính theo vai mới. Việc đếm dùng vai lúc sửa và bỏ qua bản ghi thiếu vai là đúng.
- Hệ quả: tháng 11/2026 đếm thiếu phần trước khi v1.0.5 lên. Ghi một câu vào ghi chú phát hành (thẻ V516-02), không cần sửa mã.

### 3.4 Ghi nhận khác về #110 (không thẻ, SEC xem lại khi review #110)

- `access.denied` của BR-438 được ghi trong giao dịch riêng, sau khi giao dịch chính đã rollback. `after` chỉ có `operationId`, `roles`. Đúng mẫu của guard.
- Link "Cần chú ý" có `actorUserId=<uuid>` trong đường dẫn Desk:
  - chỉ OWN thấy;
  - id nhân viên, không phải dữ liệu khách;
  - API `listAuditEvents` vốn đã nhận tham số này.

  Chấp nhận.
- `REPORTING_READ_TABLES` thêm `audit_event`. ARC duyệt quyền đọc của module. Về bảo mật, truy vấn chỉ đọc `money` / `folio_line.adjusted` và chỉ trả số đếm theo người, nên chấp nhận.
- Rủi ro còn lại, mức Low, DOM đã chấp nhận trong ví dụ 3.3 (Lan giảm lại dòng mình sau khi Hạnh tăng): người ghi dòng gốc giảm được dòng thay thế do quản lý tăng trong cùng ngày. Lần giảm này có audit và có trong `line_reduction_count`.

---

## 4. Thẻ feedback

### FB-R5-SEC-BE-V530-01
- Mức độ: Minor
- Vị trí: production, tham số `short_stay_commission_pct` (hàng cũ từ lần bootstrap đầu); runbook phát hành v1.0.5 (OPS); danh sách việc INV nhập trên Desk, việc (3) (`rules-v1.0.5.md` mục 0)
- Vấn đề: #101 chỉ đổi lần bootstrap mới. Trên production, hàng tỷ lệ cũ (hết hiệu lực từ 01/11) vẫn còn hiệu lực. Vì vậy `missing[]` không báo và Desk không hiện "Chưa có tỷ lệ hoa hồng". Lớp chặn duy nhất là INV tự nhớ nhập bảng mới trước 01/12.
- Vì sao quan trọng: nếu INV chưa nhập, kỳ chốt 01/12 trả hoa hồng sale/CTV theo tỷ lệ cũ, tức sai tiền (FB-R4-SEC-BE-01 ý 2). Lỗi này không ai thấy trên Desk.
- Đề xuất sửa:
  - OPS thêm một bước vào runbook v1.0.5 sau triển khai: đếm số hàng `config_parameter` của `short_stay_commission_pct` có `effective_from` ≥ ngày INV chọn và `created_at` sau giờ triển khai. Chỉ in **số hàng, ngày hiệu lực, vai người tạo**, không in `value`.
  - ORC nhắc INV việc (3) trong `round-summary.md` và kiểm lại bằng bước đếm trên trước 01/12.
  - Không ai trong đội nhập hay xem giá trị.
- Trạng thái: Open

### FB-R5-SEC-BE-V530-02
- Mức độ: Minor
- Vị trí: `platform/internal/parameters.service.ts` `hidden()`, `restricted()` (dòng 54–88 @ `02d8e27a`); `product/docs/specs/EP00-platform.md` mục 5.1 (dòng nhóm `short_stay_commission_pct`: xem OWN, MGR, FDL); danh mục khóa của PR-M (`long_stay_commission`, `manager_performance_bonus_pct`); `listParameters`, `getParameterHistory` (`x-roles` có `front_desk_lead`)
- Vấn đề: khóa hoa hồng không thuộc nhóm hạn chế (`is_security = false`, `br_ref` không bắt đầu bằng `SR-`), nên FDL đọc được **giá trị** và lịch sử qua `GET /parameters`. Sau khi OWN nhập bảng nội bộ, FDL thấy tỷ lệ mà màn báo giá đã giấu với FD/FDL (SR-AZ-04). PR-M sẽ thêm `manager_performance_bonus_pct`. Nếu khai như hiện nay, FDL đọc được tỷ lệ thưởng của quản lý. Đây là thu nhập của một người xác định được, tức dữ liệu cá nhân của nhân viên.
- Vì sao quan trọng: không thống nhất với SR-AZ-04 và với getManagerPerformanceBonus, nơi MGR chỉ thấy tháng của mình. Công việc của FDL không cần các tỷ lệ này.
- Đề xuất sửa:
  - BA/ARC đổi EP00 5.1: `short_stay_commission_pct`, `long_stay_commission`, `manager_performance_bonus_pct` chỉ OWN, MGR xem.
  - BE cài trong PR-M: thêm các khóa vào bộ lọc `hidden()` cho FDL, với cả `listParameters`, `getParameterHistory` và `missing[]`.
  - Test: FDL không thấy khóa trong `data`, cũng không đọc được lịch sử của khóa.
  - Mức: bắt buộc với `manager_performance_bonus_pct` trước khi PR-M lên; nên làm với hai khóa còn lại.
- Trạng thái: Open

### FB-R5-SEC-BE-V516-01
- Mức độ: **Major** (v1.0.5; điều kiện đóng FB-R4-SEC-BE-A31-01; không chặn gộp #108, #110)
- Vị trí: `inventory/internal/minibar.service.ts` `record`, nhánh R7 (dòng 470–500 trên `main` @ `18bdd279`); `recordMinibarCheck` (A37); `folio/public/line-reduction.ts` của #110 (`limitedByBr438`, `frontDeskMayReduce`, `rootLineOf`)
- Vấn đề: đếm lại minibar đảo dòng minibar đang sống rồi ghi dòng mới nhỏ hơn hoặc không ghi. Bước này không qua `adjustFolioLine`, nên không qua chặn BR-438 và không ghi `folio_line.adjusted`. FD/FDL giảm hoặc bỏ được dòng minibar người khác đếm, hoặc dòng mình đếm từ ngày trước, mà không cần FOC. Lần giảm cũng không có trong `removalsOnly`, `reductionsOnly`, `line_reduction_count` (mục 3.1).
- Vì sao quan trọng: đúng đường thất thoát A31-01 và BR-438 muốn chặn (thu tiền mặt rồi bỏ dòng, miễn cho người quen), với loại dòng hay thu tiền mặt nhất. DOM 3.3 dùng chính ví dụ minibar làm ca "bị chặn".
- Đề xuất sửa (BE-H; DOM xác nhận; ARC ghi hợp đồng):
  1. **Chặn** (khuyến nghị; áp BR-438 đã chốt cho đường thứ hai, không phải luật mới):
     - Điều kiện: trong R7, khi người gọi là FD/FDL (không có OWN/MGR, `limitedByBr438`), số tiền mới của một món nhỏ hơn dòng đang sống, và `frontDeskMayReduce(scope)` sai. `scope` là phạm vi của dòng đang sống, tính bằng `rootLineOf` + `reductionScope`: dòng `minibar_check` là `typedByHand`, người ghi là người đếm trước.
     - Khi đó: 403 `FORBIDDEN_ACTION` + `requiredFlow: foc_request`, không ghi gì (kể cả `minibar_check`), cộng một `access.denied` lý do `BR-438`.
     - Lần đếm đầu (chưa có dòng), lần đếm tăng, và FD sửa lần đếm của chính mình trong ngày vẫn được.
     - HK không thuộc BR-438, vẫn đếm lại được nhưng phải có audit theo ý 2.
     - ARC thêm 403 này cho `recordMinibarCheck`; FE xử lý như hộp Điều chỉnh (mở "Gửi miễn có duyệt", FOC minibar tự áp theo BR-436).
  2. **Tối thiểu, bắt buộc trong v1.0.5:**
     - Mọi lần đếm lại làm dòng minibar nhỏ đi (mọi vai) ghi **một** `folio_line.adjusted` trên dòng cũ.
     - `before`: `category: minibar`, `amountVnd` cũ, `actorRole` và 4 khóa dòng gốc; `after`: `amountVnd` mới (0 nếu không còn dòng); `reason: minibar_recount`.
     - Nhờ vậy `reductionsOnly`/`removalsOnly` và `line_reduction_count` thấy được lần giảm.
  3. Test:
     - FD đếm lại thấp hơn lần đếm của HK → 403 + `requiredFlow`, folio và `minibar_check` không đổi, có một `access.denied` (ý 1);
     - FD đếm lại lần mình vừa đếm → 201 + một `folio_line.adjusted` (ý 2);
     - HK đếm lại thấp hơn → 201, có trong `reductionsOnly`.
  - Nếu DOM/ARC không kịp ý 1 trong v1.0.5: làm ý 2, ghi `decision-log` "SEC chấp nhận rủi ro còn lại Medium tới v1.0.6", và ý 1 vào backlog v1.0.6. Khi đó SEC vẫn đóng A31-01 với ý 2 + #110.
- Trạng thái: Open

### FB-R5-SEC-BE-V516-02
- Mức độ: Suggestion
- Vị trí: kế hoạch tag v1.0.5 (ORC/OPS); ghi chú phát hành v1.0.5
- Vấn đề: hai PR định nghĩa `before.rootLineManual` khác nhau:
  - ở #108: `source = manual`, nên tính cả dòng trả muộn B15/B13/B16 do luồng Desk ghi;
  - ở #110: dòng A30 + dòng đếm minibar (`typedByHand`), dòng trả muộn không tính.

  Bản ghi audit ghi giữa hai lần gộp mang nghĩa cũ. Chốt chặn không bị ảnh hưởng, vì #110 tính lại khi chạy, không đọc từ audit.
- Vì sao quan trọng: dữ liệu audit trên production nên có một nghĩa. Nếu chỉ #108 lên production, người xem audit sẽ đọc sai "gõ tay".
- Đề xuất sửa:
  - #108 và #110 lên **cùng một tag** production; không cắt tag có #108 mà thiếu #110.
  - Ghi chú phát hành thêm một câu: "Cảnh báo sửa giảm dòng theo người (`line_reduction_count`) tháng 11/2026 chỉ đếm từ lúc v1.0.5 lên" (mục 3.3).
- Trạng thái: Open

### FB-R5-SEC-BE-V516-03
- Mức độ: Suggestion
- Vị trí: `folio/internal/folio-lines.service.ts` `adjust`, `if (folio.status === 'settled' && !managers) throw problem('FORBIDDEN_ACTION')` (dòng 522 trên `main`); `folio/internal/folio.controller.ts` `adjustFolioLine` (khối `catch` của #110)
- Vấn đề: FD/FDL sửa folio đã thanh toán (A32) bị 403 nhưng không ghi `access.denied`. Lần bị chặn BR-438 thì có ghi.
- Vì sao quan trọng: không trái SR-AZ-01 (mục 3.2). Nhưng một lần thử giảm tiền sau trả phòng cũng đáng nằm trong cùng nhật ký với BR-438, để quản lý thấy một người thử nhiều lần.
- Đề xuất sửa: thêm `auditReason: 'A32'` vào lỗi đó. Trong `catch` của #110, ghi `access.denied` khi `auditReason` thuộc `{BR-438, A32}`. Có thể làm trong #110 hoặc để B-KYTHUAT.
- Trạng thái: Open

---

## 5. Ghi chú (Info, không thẻ)

- **QA:** staging dùng DS-E có hàng tỷ lệ cũ, nên Desk staging không bao giờ hiện `rate_missing` cho đơn ngắn ngày. Ca "Chưa có tỷ lệ hoa hồng" chỉ được kiểm ở test tích hợp (cơ sở bỏ khóa, `seedSales(..., { skipParams })`). Khi PR-M thêm `long_stay_commission`, `manager_performance_bonus_pct`, DS-E nên **để trống** hai khóa này để staging có ca thật, hoặc dùng `test_rate_*`.
- **BE-H/DOM:** `test_rate_short` = 1,37 và `test_rate_ctv` = 2,41 được chọn lẻ để không trùng bảng thật. SEC không mở bảng nội bộ nên giả định chúng không trùng. DOM là người giữ bảng; nếu thấy trùng thì đổi số thử, không cần báo số thật.
- **#105 / #108:** cùng sửa `audit-log.controller.ts` (`boolQuery`). PR gộp sau giữ một hàm. Nếu chỉ giải xung đột như vậy thì SEC không cần đọc lại.

## 6. Điểm làm tốt

- #101 kiểm "không có số" bằng tên khóa và quét mã, không bằng danh sách số. Test tự giữ quy tắc G3 về sau, mà chính nó không thành chỗ lộ số. Mọi chỗ đọc tỷ lệ gom về một tệp, chỉ bắt đúng `ParameterMissingError`.
- `missing[]` dùng lại đúng bộ lọc vai của `data` thay vì viết bộ lọc thứ hai. Test có ca MGR không thấy tên khóa chỉ OWN và FDL không có trường.
- #108 phát hiện và sửa chỗ bỏ dòng trên folio mở không vào audit tiền. Đó đúng là ca chính của A31-01. Test đọc lại khóa từ bảng `audit_event`, không chỉ từ phản hồi API.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – review PR #101 (BE-H V5-30) @ 02d8e27a: DUYỆT** (rounds/round-05/reviews/SEC-on-be-prs-101-108.md mục 1). Code, test, mô tả PR, commit không có tỷ lệ/số tiền hoa hồng sale/CTV (số cũ ESC-005 chỉ ở dòng bị xóa; test mới chỉ test_rate_*; T30-4 kiểm theo tên khóa). rate_missing: không ratePct/amountVnd, ottimoRemainingVnd = tổng, không dòng commission, FD/FDL không có object. missing[] cùng bộ lọc vai với data, chỉ OWN/MGR, MGR không thấy payment_receiving_account. ds-e.json và BR-903-01…04, BR-326-01 giữ số cũ có nhãn hết hiệu lực – **không đổi** khi #101 gộp (đã trong lịch sử git, DS-E chỉ dev/test/staging); không ai cập nhật sang số mới; ca mới chỉ test_rate_*. Thẻ: V530-01 (Minor, production còn hàng tỷ lệ cũ → missing[] không báo; runbook đếm hàng mới, không in giá trị, trước 01/12), V530-02 (Minor, FDL đọc được khóa hoa hồng qua listParameters; bắt buộc chặn với manager_performance_bonus_pct ở PR-M) | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |`

`| 2026-11-07 | 5 | **SEC – review PR #108 (BE-B V5-16 phần lọc) @ b5f60440: DUYỆT** (rounds/round-05/reviews/SEC-on-be-prs-101-108.md mục 2, 3). Bộ lọc action/removalsOnly/reductionsOnly chỉ thêm AND sau phạm vi own của FD/FDL, mọi giá trị qua tham số, jsonb ép kiểu an toàn – không vượt phạm vi, không injection, không kênh suy luận. Allowlist folio_line thêm 4 khóa id/đúng-sai, không số tiền. Bỏ dòng trên folio mở nay ghi folio_line.adjusted (một bản ghi mỗi lần sửa). **FB-R4-SEC-BE-A31-01 chưa đóng**: đóng khi #110 gộp (403 + requiredFlow + access.denied), xong phần tối thiểu V516-01, #108 + #110 cùng tag. Ý kiến #110: đếm lại minibar vượt BR-438 → **V516-01 Major** (chặn FD/FDL khi giảm dòng không phải của mình trong ngày + bắt buộc ghi folio_line.adjusted cho mọi lần đếm lại làm giảm; nếu chưa kịp chặn thì SEC chấp nhận Medium tới v1.0.6 với phần audit); 403 A32 không ghi access.denied – chấp nhận (V516-03 Suggestion); audit cũ thiếu actorRole không đếm – chấp nhận, ghi chú phát hành (V516-02 Suggestion). Không ESC | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |`
