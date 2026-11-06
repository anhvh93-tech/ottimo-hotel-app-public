# ARC review PR #101 – BE-H PR-H1 (V5-30: `commission.status`, `listParameters.missing[]`, bỏ tỷ lệ hoa hồng khỏi mã)

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- PR: https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/101, nhánh `r5-h1`, HEAD **`02d8e27a`**, CI xanh (9 job đạt, 3 job publish/deploy bỏ qua như mọi PR). 9 tệp, không migration, không đổi `openapi.yaml`.
- Đã đọc:
  - thân PR, `gh pr diff 101`;
  - hợp đồng trên `main`: `contract-0.3.13.md` mục 1.10, 1.22, 1.24; `openapi.yaml` `QuoteCalculation.commission`, `listParameters` (mô tả, `missing` `x-visible-to: [owner, manager]`);
  - DOM `rules-v1.0.5.md` mục 4.1, 4.4, 7.3, 13.1, 13.2;
  - câu SQL V5-25 `product/services/api/scripts/v5-25-parameter-shape-check.sql` (sha256 `f5db74ac…243f`, khớp ghim), `parameter-shapes.ts` `leaseTermsIssue`;
  - review ARC PR #96 mục 12.6 (đề xuất `lease_terms` là khóa dừng thứ 7);
  - review đã có trên `main` @ `355a2929`, đọc để khớp thẻ: DOM `DOM-on-be-prs-101-108-110.md` (mục 1, thẻ 101-01, 101-02), SEC `SEC-on-be-prs-101-108.md` (mục 1, thẻ V530-01, V530-02); DOM `rules-v1.0.5.md` mục 0 việc (4), mục 14;
  - mã liên quan: `folio.service.ts` `syncCommission`, `quotes.service.ts`, `parameters.service.ts` (`hidden`, `canSeeRestricted`), `production-bootstrap.ts`, `admin-web` `QuoteDialog.tsx`, `rbac-matrix.md` S17, S24, A60, A102.
- Đã chạy (worktree tách rời ở scratchpad, `02d8e27a` gộp thử với `main` @ `ba2dc355`, tức sau #96; Postgres 17 tạm trong Docker với mật khẩu CI-only của `ci.yml`, cổng riêng; đã dừng, xóa container và worktree; không chạm staging/production):
  - gộp với `main`: không xung đột; `tsc --noEmit` sạch;
  - 8 tệp test (465 ca) đạt: `v5-30-commission-rate`, `v5-30-commission-status`, `sales`, `v5-25-parameter-save` (chạy câu SQL), `v5-25-parameter-shapes`, `production-bootstrap`, `parameters-delete-architecture`, `v5-25-early-departure-broken`;
  - gộp thêm #103 (`r5-s1` @ `60c25cb9`, cùng sửa `quote-pricing.ts`): tự gộp, `tsc` sạch, 5 tệp (55 ca) gồm `v5-14-quote-typed-rates`, `v5-22-rate-bounds` đạt;
  - ca tạm của ARC cho câu hỏi V5-25 (mục 3): thêm vào `GOOD_SHAPES` một `lease_terms` đúng dạng bootstrap cũ, 5 kỳ, mỗi kỳ có `commissionStaffPct`, `commissionCollaboratorPct` (giá trị thử). Lưu qua `setParameter` → 200; câu SQL → `ok = t`. Đã bỏ ca tạm;
  - đột biến của ARC: `rate_missing` → `computed` 0 (6 ca đỏ); thiếu dòng → bảng toàn 0 (5 ca đỏ); `missing[]` bỏ lọc vai (1 ca đỏ); `missing[]` trả cho mọi vai thì **không** ca nào đỏ, vì serializer đã bỏ thuộc tính cho FDL theo `x-visible-to`. Hai lớp chặn, đúng thiết kế, không phải lỗ hổng.

## Kết luận: **DUYỆT**

Gộp được ở `02d8e27a`. Mã đúng hợp đồng 0.3.13 mục 1.10, 1.24 và DOM 4.1, 7.3. Đúng quy tắc G3: test chỉ dùng `test_rate_*`, mô tả PR không có số, diff chỉ **xóa** các số ESC-005 cũ.

- Trên PR: **0 Blocker · 0 Major · 0 Minor**. Không thẻ nào là điều kiện gộp.
- Ngoài PR: **1 Major** (FB-R5-ARC-BE-H1-01, cùng vấn đề với thẻ SEC V530-02). Hợp đồng của ARC và mã hiện tại cho FDL đọc bảng tỷ lệ hoa hồng, trái DOM 4.4. Thẻ không chặn gộp #101. ARC đề nghị làm trong v1.0.5, không chờ PR-M, vì chủ đầu tư nhập bảng thật ngay trên v1.0.4.
- Ngoài PR còn 1 Minor (H1-02). H1-03 nay là **chỗ đặt ARC chọn cho thẻ DOM FB-R5-DOM-BE-101-01** (Major, BE-H `r5-h1b`).
- Hai câu BE hỏi ARC: **đồng ý cả hai** (mục 2).
- Câu hỏi V5-25: bỏ cột hoa hồng **không** làm câu SQL ra `ok = f` cho dòng `lease_terms` cũ. `lease_terms` vẫn an toàn làm khóa dừng thứ 7. Câu SQL và SHA giữ nguyên (mục 3).
- ESC mới: không.

## 1. Đối chiếu hợp đồng và luật

| Việc | Nguồn | Mã ở PR | Kết quả |
|---|---|---|---|
| `commission.status` 3 giá trị | 0.3.13 1.10; `QuoteCalculation.commission.status` | `commission-rate.ts` `commissionRateOf`: không người hưởng → `not_applicable`; người hưởng mà bảng không có tỷ lệ hợp lệ → `rate_missing`; còn lại `computed` | Đúng |
| `rate_missing` không `ratePct`/`amountVnd`, không tính bằng 0 hay số cũ | 1.10; DOM 4.1, 7.3 | `{ status, ruleRef }`; `ottimoRemainingVnd = totalVnd`; `quote.commission_vnd` null; `commissionRatePct` null | Đúng (T30-1, T30-5) |
| Thiếu tỷ lệ lúc chốt: không tạo dòng, lần đồng bộ sau tạo | DOM 7.3; 0.3.13 1.22 | `syncCommission`: không ảnh chụp thì đọc tỷ lệ hiệu lực ngày đồng bộ; `rate_missing` → không có `desired` | Đúng (ca T30-2 đổi `adults` → có dòng `projected` theo tỷ lệ thử) |
| Mọi chỗ đọc khóa hoa hồng bắt `ParameterMissingError` | 1.24 (BE 17) | một tệp `folio/public/commission-rate.ts`; test quét `src/modules` chỉ một tệp chứa chuỗi khóa | Đúng |
| `listParameters.missing[]` | 1.10, 1.24; `missing` `x-visible-to: [owner, manager]` | cùng bộ lọc vai với `data` (gồm `ownerOnlyKey`), sắp theo tên; chỉ trả khi OWN/MGR | Đúng (T30-3). Test bootstrap ghim: DB mới có `missing` = đúng `INV_ENTERS_KEYS` |
| Bỏ số mặc định | 1.10; DOM 4.1 "mã không có số mặc định"; T30-4 | `short_stay_commission_pct` sang `INV_ENTERS_KEYS`; `lease_terms` bỏ 2 cột; danh mục 0002 không có `default_value` cho khóa này | Đúng. Test so tên khóa, không so số |
| Không mã nào đọc hoa hồng từ `lease_terms` | DOM 7.3 dòng `long_stay_commission` | test quét `src` (trừ migration) không có `commission(Staff\|Collaborator)Pct` | Đúng. Trước PR cũng không có chỗ đọc, nên không đổi hành vi |

**Tương thích client:** `commission` nay luôn có mặt với OWN/MGR/SAL/CTV, kể cả khi `not_applicable`. Desk (`QuoteDialog.tsx` dòng 652) chỉ vẽ dòng hoa hồng khi có `amountVnd`. Vì vậy không hiện số sai, chỉ chưa có chữ "Chưa có tỷ lệ hoa hồng" cho T30-1. Câu chữ này là việc FE-A + UXD theo thứ tự PR của 1.10 (BE → FE-A), chưa có trong `strings-*.json`. ORC xếp cùng PR-C1 hoặc PR FE-A kế tiếp.

## 2. Trả lời hai câu BE hỏi ARC

### 2.1 Dạng `commission` khi `status ≠ computed`: **đồng ý `{ status, ruleRef }`**

- Mọi thuộc tính của `commission` trong schema đều tùy chọn. Mô tả `status` chỉ cấm `ratePct`, `amountVnd` khi `rate_missing`.
- Không trả `baseVnd` khi chưa có tỷ lệ là hợp lý: số cơ sở đứng một mình không dùng được, lại dễ bị đọc nhầm thành số hoa hồng.
- ARC ghi một câu vào PR hợp đồng chữ kế tiếp (sau #111, hoặc 0.3.14): "`status` ≠ `computed` → chỉ có `status`, `ruleRef`".

### 2.2 Tỷ lệ 0 OWN đã nhập: **đồng ý `computed`, số tiền 0, ảnh chụp 0**

- 0 là quyết định của chủ đầu tư ("đơn này không có hoa hồng"), không phải thiếu tỷ lệ. Báo `rate_missing` thì Desk sẽ nhắc OWN nhập một bảng đã nhập rồi.
- Ảnh chụp 0 trên đơn đúng DOM 4.1 "đơn chụp tỷ lệ lúc tạo". OWN đổi tỷ lệ sau đó thì đơn này giữ 0.
- `syncCommission` không tạo bản ghi khi tỷ lệ 0 (`ratePct > 0`), như trước PR. Không có bản ghi 0 đ là chấp nhận được: màn Hoa hồng không cần dòng 0.
- **Lưu ý cho PR-M** (`AttentionItem` `commission_rate_missing`, 0.3.13 1.22): đếm theo "có người hưởng, `commission_rate_pct_snapshot IS NULL`, không có bản ghi sống, và tỷ lệ hiệu lực hôm nay vẫn thiếu". Không đếm theo "không có bản ghi `commission`". Đếm kiểu sau sẽ tính nhầm các đơn có tỷ lệ 0.

## 3. Câu hỏi V5-25: bỏ cột hoa hồng khỏi `lease_terms` có làm câu SQL ra `ok = f` không – **không**

1. **PR không đụng dữ liệu production.**
   - Không migration.
   - `production-defaults.ts` chỉ chạy khi bootstrap một DB trống. `production-bootstrap.ts` từ chối DB đã có cơ sở.
   - Dòng `lease_terms` trên production vẫn còn hai cột hoa hồng, vì bảng chỉ thêm, không sửa.
2. **Câu SQL không kiểm khóa lạ trong phần tử `lease_terms`.**
   - Câu SQL có điều kiện "không có khóa khác" (`NOT EXISTS (… jsonb_object_keys … NOT IN …)`) cho `los_discount`, `cancel_policy_direct`, hai khóa bậc giờ, `early_departure_refund`, `checkout_reminders`, `max_open_holds_per_user`.
   - Riêng `lease_terms` thì không có điều kiện đó. Phần tử chỉ được kiểm `months` nguyên 1–60, và `discountPct` (nếu có) 0–100, tối đa 2 chữ số thập phân. Mảng chỉ được kiểm 1–12 kỳ, `months` không trùng.
   - `leaseTermsIssue` (TS) cũng vậy: "the other fields … are left as they are".
   - Vì vậy dòng cũ có `commissionStaffPct`/`commissionCollaboratorPct` vẫn ra `ok = t`. Dòng mới OWN lưu, có hay không có hai cột, cũng ra `ok = t`.
3. **Đã thử:** ca tạm ở đầu tệp (dạng bootstrap cũ, 5 kỳ, đủ hai cột) cho kết quả `setParameter` 200 và câu SQL `ok = t`. Ca này chạy trong bộ "same verdict as the save rules" của `v5-25-parameter-save`, trên `main` sau #96 gộp với #101.
4. **Kết luận cho ĐK-2 (ARC review #96 mục 12.6):**
   - `lease_terms` vẫn an toàn làm khóa dừng thứ 7. ARC giữ đề xuất.
   - Không đổi câu SQL, không ghim lại SHA `f5db74ac…243f`.
   - Thứ tự gộp #101 so với #96, #109 không ảnh hưởng tới câu SQL.
5. **Ràng buộc ARC chốt từ nay:**
   - Khi `lease_terms` là khóa dừng, **không** thêm luật "không có khóa khác" cho phần tử `lease_terms`, ở cả `parameter-shapes.ts` lẫn câu SQL. Nếu thêm, dòng production còn hai cột hoa hồng sẽ ra `ok = f` và dừng lên bản.
   - Muốn siết thì làm theo thứ tự:
     1. PR-M lên (`long_stay_commission`);
     2. OWN lưu một dòng `lease_terms` mới không có hai cột (Desk, Hiệu lực từ hôm nay);
     3. siết luật ở bản sau, ghim lại SQL.

## 4. Thẻ feedback

### FB-R5-ARC-BE-H1-01 (ngoài PR #101 – ARC hợp đồng + BE)
- Mức độ: Major
- Vị trí:
  - `product/services/api/src/modules/platform/internal/parameters.service.ts` `hidden()` (dòng 82–88 ở `02d8e27a`) và `listParameters`, `getParameterHistory`;
  - `openapi.yaml` `listParameters` (mô tả "Tham số bảo mật chỉ OWN/MGR thấy"), `getParameterHistory` (`x-roles: [owner, manager, front_desk_lead]`);
  - `rbac-matrix.md` S24 (FDL = R).
- Vấn đề:
  - `hidden()` chỉ giấu tham số bảo mật (`is_security` hoặc `br_ref` bắt đầu `SR-`). `short_stay_commission_pct` (BR-903) và `lease_terms` (BR-201) không phải tham số bảo mật.
  - Vì vậy FDL gọi `listParameters`/`getParameterHistory` (màn S24, quyền R) đọc được bảng tỷ lệ hoa hồng ngắn ngày. FDL cũng đọc được hai cột hoa hồng còn nằm trong dòng `lease_terms` trên production.
  - Như thế trái DOM 4.4 ("Tỷ lệ cấu hình: … Vai khác: Không"), S17 (Hoa hồng: FDL ✖) và A60 (Xem hoa hồng: FDL ✖).
  - Đây là chỗ hở của hợp đồng ARC, có từ trước PR này; #101 không làm tệ hơn.
- Vì sao quan trọng:
  - Bảng hoa hồng là bảng nội bộ chủ đầu tư giữ kín (FB-R4-SEC-BE-01 Major, G3).
  - Theo DOM `rules-v1.0.5.md` mục 0 việc (4) (sửa 07/11), chủ đầu tư nhập bảng thật **ngay trên Desk v1.0.4**, không chờ v1.0.5. Từ lúc đó, FDL đọc được số thật trên màn Tham số.
  - Hiện production còn bảng ESC-005 cũ. Số này đã có trong lịch sử repo và không coi là bí mật (SEC 1.1), nên chưa lộ số mới.
- Liên hệ thẻ SEC **FB-R5-SEC-BE-V530-02** (Minor): cùng vấn đề. ORC đã xếp V530-02 vào PR-M (decision-log 07/11): bắt buộc với `manager_performance_bonus_pct`, nên làm cả khóa ngắn ngày. ARC không đổi mức rủi ro của SEC. ARC chỉ đề nghị **kéo phần `short_stay_commission_pct` lên v1.0.5**, vì PR-M chưa chắc lên cùng tag, còn số thật thì có ngay từ v1.0.4. ORC chọn; SEC chấp nhận khoảng hở nếu giữ lịch PR-M.
- Đề xuất sửa:
  - **ARC:** thêm vào PR hợp đồng chữ kế tiếp (sau #111) câu sau cho `listParameters` và `getParameterHistory`:
    - "khóa tỷ lệ hoa hồng (`short_stay_commission_pct`; `long_stay_commission`, `manager_performance_bonus_pct` khi PR-M lên) chỉ OWN/MGR thấy. Vai khác không thấy tên, giá trị hay lịch sử, như `payment_receiving_account` với MGR";
    - Không đổi schema, không đổi `x-roles`.
  - **BE** (một commit nhỏ, không migration, khoảng 0,25 ngày; nên đi cùng `r5-h1b` vì cùng làn hoa hồng của BE-H):
    - thêm tập `COMMISSION_RATE_KEYS` cạnh `ownerOnlyKey`, lọc ở cả `data`, `missing`, lịch sử. `getParameterHistory` của khóa bị giấu trả `404 NOT_FOUND`, như tham số bảo mật với FDL hôm nay (`hidden(def, roles)`), để không lộ là khóa có tồn tại. Cách này khớp đề xuất của SEC V530-02 ("thêm các khóa vào bộ lọc `hidden()` cho FDL");
    - PR-M chỉ thêm hai khóa mới vào cùng tập;
    - test: FDL không thấy khóa trong `data`, không đọc được lịch sử; MGR, OWN thấy như cũ.
  - **Không cần** bỏ cột `commission*` khỏi `lease_terms` khi trả cho FDL. Số trong hàng cũ là số ESC-005 (SEC 1.1). Hàng `lease_terms` lưu sau #101 không còn cột hoa hồng, còn hoa hồng thuê tháng nằm ở khóa riêng `long_stay_commission` (PR-M).
  - **FE-A:** màn S24 của FDL tự mất hai dòng. Không cần sửa nếu Desk vẽ theo `data`.
  - **SEC** xác nhận.
  - **Hạn:** ARC đề nghị cùng tag v1.0.5. **Không** bảo chủ đầu tư chờ mới nhập bảng: DOM đã nêu mỗi ngày chậm là thêm đơn chụp tỷ lệ cũ.
- Trạng thái: Open

### FB-R5-ARC-BE-H1-02 (ngoài PR #101 – BE, PR-M hoặc R5-B-05)
- Mức độ: Minor
- Vị trí: `product/services/api/src/modules/platform/public/parameter-shapes.ts` (chưa có luật cho `short_stay_commission_pct`); DOM 4.1 "Kiểm khi lưu: tỷ lệ 0–100, tối đa 2 chữ số thập phân".
- Vấn đề:
  - V5-25 chưa có luật lưu cho khóa này. Trên Desk, OWN gõ sai dạng vẫn lưu được, ví dụ `{"staff": "3"}` (chuỗi), thiếu `collaborator`, hoặc 3 chữ số thập phân.
  - Gõ sai thì `commissionPctFor` đọc ra `rate_missing` cho người hưởng tương ứng.
  - Lần đồng bộ kế tiếp của đơn không có ảnh chụp (đơn B1 có người chốt, đơn tạo lúc `rate_missing`) **hủy** bản ghi `projected` đang có (`void`, `resync`) mà không ai được báo. Hành vi này có từ trước #101.
- Vì sao quan trọng: chủ đầu tư sắp nhập bảng thật lần đầu. Gõ nhầm làm mất hoa hồng của sale, CTV lặng lẽ tới kỳ chốt 01/12. Báo giá có hiện "Chưa có tỷ lệ" (sau FE-A), nhưng đơn đã chốt thì không.
- Đề xuất sửa:
  - thêm `commissionTableIssue` vào `parameter-shapes.ts`: object đúng hai khóa `staff`, `collaborator`, mỗi khóa là số 0–100, tối đa 2 chữ số thập phân. Luật này đúng DOM 4.1, 7.3 ("nhập cùng một số"); dùng lại `pctIssue`;
  - ca thêm vào `BAD_SHAPES`/`GOOD_SHAPES` chỉ dùng `test_rate_*`;
  - **không** đưa khóa này vào câu SQL V5-25: khóa không đọc ở đường bán, và câu SQL đã ghim;
  - làm ở PR-M, hoặc ở R5-B-05 nếu PR-M trượt;
  - tới khi có luật: hướng dẫn nhập của chủ đầu tư thêm một bước "nhập xong, mở một báo giá có người chốt sale và một có CTV, thấy tỷ lệ là đúng".
- Trạng thái: Open

### FB-R5-ARC-BE-H1-03 – chỗ đặt cho thẻ DOM FB-R5-DOM-BE-101-01 (BE-H, `r5-h1b`)
- Mức độ: Major (theo thẻ DOM 101-01; không chặn gộp #101; xong trước khi gộp PR-M và trước kỳ chốt 01/12)
- Vị trí: `product/services/api/src/modules/folio/public/folio.service.ts` `syncCommission` (dòng 3985–3990 ở `02d8e27a`), `tryEarnCommissions`; `reservations/public/folio-sync-port.ts`; nơi gọi `tryEarnCommissions`: `frontdesk/internal/checkout.service.ts` (B18), `payments/internal/payments.service.ts` `tryEarn`, `folio/internal/foc.service.ts`.
- Vấn đề:
  - Lúc review, ARC nêu thẻ này là Suggestion "hỏi DOM": đơn không có ảnh chụp đọc lại tỷ lệ ở **mỗi** lần đồng bộ.
  - DOM đã trả lời và nâng thành Major ở thẻ 101-01, thêm ý chính: nhận phòng và trả phòng thường không đồng bộ lại, nên đơn chốt lúc thiếu tỷ lệ có thể không bao giờ có hoa hồng.
  - DOM giao ARC chọn chỗ đặt. ARC chọn như dưới. Luật và ca test theo DOM 101-01 và T-14-1.
- Vì sao quan trọng: sai tiền của sale/CTV, phát hiện muộn ở kỳ chi (DOM 101-01).
- Đề xuất sửa (ARC chọn chỗ đặt; không migration, không đổi hợp đồng):
  1. **Bảo đảm có bản ghi ở mốc "đạt" (DOM ý 1):**
     - thêm `ensureCommission(tx, stay: ConfirmedStay, who)` vào `FolioSyncPort` (reservations định nghĩa, folio cài). Hàm chỉ chạy `syncCommission`, không đụng dòng folio, chạy lại nhiều lần không đổi gì;
     - `tryEarnCommissions` nhận thêm `stay?: ConfirmedStay`. Có `stay`, đơn có người chốt, không có bản ghi `projected` → gọi `ensureCommission` trước khi xét "đạt";
     - B18 (`checkout.service.ts`) truyền `stay` lấy qua `StayPort.confirmedStay`, đúng như các lần `resyncStay` trong cùng tệp;
     - các mốc sau trả phòng (`payments.service.ts` `tryEarn`, đối soát, `foc.service.ts`) lấy `stay` qua cổng `public` của reservations mà module đó đang dùng. Thiếu hàm thì thêm `confirmedStay` vào cổng đó. Không import `internal`; `module-boundaries.test.ts` phải xanh.
  2. **Ghim tỷ lệ ở lần tạo bản ghi đầu (DOM ý 2):**
     - ghim ở phía folio, không ghi ngược vào ảnh chụp giá của đơn. Ảnh chụp thuộc reservations; folio ghi vào đó là phá ranh giới module;
     - `syncCommission` đọc tỷ lệ theo thứ tự: `stay.commissionRatePctSnapshot`, rồi `rate_pct_snapshot` của bản ghi `commission` **đầu tiên** của đơn cùng `payee_type` (mọi trạng thái, `ORDER BY created_at, id`), rồi mới tới bảng hiệu lực hôm nay;
     - kết quả giống BR-903 (5): mỗi đơn một tỷ lệ. Màn Hoa hồng và PR-M đọc tỷ lệ trên bản ghi, nên không cần thêm cột;
     - lưu ý:
       - tỷ lệ 0 lúc đồng bộ đầu không tạo bản ghi, nên không ghim. Chấp nhận, vì 0 là quyết định của chủ đầu tư;
       - ghim làm lần gõ nhầm số khó sửa hơn. Lý do này làm thẻ H1-02 (luật lưu) quan trọng hơn.
  3. **Đồng bộ ngay khi chủ đầu tư lưu bảng (DOM ý 3, "Nên"):**
     - **không** gọi từ `setParameter`, vì platform không được import folio hay reservations;
     - nếu làm: phía reservations chạy `ensureCommission` cho đơn đã xác nhận, chưa trả phòng, có người chốt, chưa có bản ghi, trong một job đêm có sẵn. Hoặc PR-M làm khi vẽ mục "Cần chú ý" `commission_rate_missing`, qua một nút OWN bấm (không ghi dữ liệu trong lệnh GET);
     - ý 1 đã bảo đảm đúng tiền ở mốc "đạt", nên ý 3 chỉ để màn Hoa hồng đúng sớm hơn.
  4. Test: ca T-14-1 của DOM, chỉ dùng `test_rate_*`, cộng một ca thu công nợ sau trả phòng: chủ đầu tư nhập tỷ lệ sau B18, khách trả nợ → có bản ghi `earned`.
- Trạng thái: Open

## 5. Ghi chú cho ORC

- **Thứ tự gộp:** #101 và #103 cùng sửa `quote-pricing.ts`. Gộp theo thứ tự nào cũng tự gộp được. ARC đã thử cả hai trên `main` @ `ba2dc355`: `tsc` sạch, test đạt. PR gộp sau chỉ cần CI xanh lại.
- **FE-A + UXD** (không phải thẻ, đã có trong thứ tự PR của 1.10):
  - câu "Chưa có tỷ lệ hoa hồng" trên hộp báo giá khi `status = rate_missing` (T30-1);
  - "Chưa có giá trị" trên màn Tham số theo `missing[]`.
- **QA:** fixture DS-E (`tests/fixtures/seed/ds-e.json`) và oracle BR-903-01 (`sales.test.ts`, tỷ lệ CTV cũ) vẫn mang tỷ lệ ESC-005 cũ, như BE đã nêu. G3 muốn đổi sang `test_rate_*`. Việc của QA/DOM, không chặn PR này. SEC quyết mức.
- **Production:** sau khi #101 lên, `missing[]` của production **không** có `short_stay_commission_pct`, vì production đã có dòng (giá trị cũ). Chủ đầu tư nhập bảng mới trên Desk bằng "Hiệu lực từ" hôm nay, ngay trên v1.0.4 (DOM mục 0 việc (4)). Không chờ thẻ H1-01.

## 6. Điểm làm tốt

- Một tệp duy nhất đọc khóa hoa hồng, kèm test quét mã. Lần sau thêm `long_stay_commission` hay thưởng quản lý chỉ cần sửa một chỗ, và CI bắt chỗ đọc thứ hai.
- T30-4 so **tên khóa**, kể cả khóa lồng trong giá trị, không so số. Đúng tinh thần G3. Test bootstrap ghim `missing` của DB mới đúng bằng `INV_ENTERS_KEYS`.
- Ca tích hợp đi trọn đường "báo giá → giữ chỗ → xác nhận cọc khi `rate_missing` → OWN nhập tỷ lệ thử → đồng bộ tạo bản ghi". Ca chứng minh đúng hành vi DOM 7.3, không chỉ kiểm phản hồi API.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review PR #101 (BE-H PR-H1, V5-30) @ 02d8e27a: DUYỆT** (rounds/round-05/reviews/ARC-on-be-pr-101-h1.md). Đúng 0.3.13 1.10, 1.24, DOM 4.1, 7.3; G3 đạt. ARC đồng ý: \`commission\` khi status ≠ computed = {status, ruleRef}; tỷ lệ 0 = computed 0 đ, ảnh chụp 0, không bản ghi (PR-M đếm commission_rate_missing theo ảnh chụp NULL, không theo "không có bản ghi"). V5-25: bỏ cột hoa hồng khỏi lease_terms không làm câu SQL ra ok = f (phần tử lease_terms không kiểm khóa lạ; ARC thử dạng bootstrap cũ → ok = t); lease_terms vẫn là khóa dừng thứ 7; SQL và SHA f5db74ac…243f giữ nguyên; không thêm luật "không khóa lạ" cho lease_terms khi nó còn là khóa dừng. Ngoài PR: **FB-R5-ARC-BE-H1-01 (Major, cùng vấn đề SEC V530-02)** FDL đọc được bảng tỷ lệ hoa hồng qua listParameters/getParameterHistory (trái DOM 4.4, S17, A60) – ARC thêm câu hợp đồng; BE thêm COMMISSION_RATE_KEYS vào bộ lọc giấu (lịch sử 404), ARC đề nghị kéo phần short_stay_commission_pct lên v1.0.5 cùng r5-h1b thay vì chờ PR-M vì INV nhập bảng thật ngay trên v1.0.4; không bảo INV chờ; ORC chọn, SEC chấp nhận khoảng hở nếu giữ PR-M. H1-02 (Minor) luật lưu short_stay_commission_pct theo DOM 4.1. **H1-03 = chỗ đặt ARC chọn cho DOM 101-01** (r5-h1b): ensureCommission trên FolioSyncPort, tryEarnCommissions nhận stay và bảo đảm bản ghi trước khi xét đạt ở B18 và các mốc sau trả phòng; ghim tỷ lệ phía folio bằng rate_pct_snapshot của bản ghi commission đầu tiên cùng payee_type (không ghi ngược vào ảnh chụp của reservations); đồng bộ khi lưu bảng không gọi từ setParameter. | ARC | Không ESC |`
