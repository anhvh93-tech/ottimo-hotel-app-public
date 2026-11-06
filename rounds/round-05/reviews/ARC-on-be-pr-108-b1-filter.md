# ARC review PR #108 – BE-B PR-B1 phần lọc (V5-16: `action`, `removalsOnly`, `reductionsOnly`, khóa audit dòng gốc) và trả lời hai điểm của PR-B2 #110

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- PR: https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/108, nhánh `r5-b1-filter`, HEAD **`b5f60440`**, CI xanh (9 job đạt, 3 job publish/deploy bỏ qua như mọi PR). 5 tệp, không migration, không đổi `openapi.yaml`.
- Đã đọc:
  - thân PR, `gh pr diff 108`;
  - hợp đồng trên `main`: `contract-0.3.13.md` mục 1.5 và bổ sung 1 mục 1.20; `openapi.yaml` `listAuditEvents` (`action`, `removalsOnly`, `reductionsOnly`), bảng "Mã lỗi theo trường";
  - DOM `rules-v1.0.5.md` mục 3.1–3.5, 7.2;
  - BE C0313-04, C0313-20 (`BE-on-contract-0.3.13.md`);
  - `architecture.md` 5.1 (mô hình đọc `reporting`), ARC `openapi-0.3.7.md` 11.4 (C1–C6), `coding-standards.md` mục 2 và 10;
  - mã liên quan: `folio-lines.service.ts` `adjust`, `folio.service.ts` `reverseLine`, các chỗ ghi dòng folio có `source` (`stay.service.ts`, `stay-support.ts` `replaceLateCharge`, `checkin.service.ts`, `checkout.service.ts`, `minibar.service.ts`, `guest-request-lifecycle.ts`), lược đồ `audit_event`, chỉ mục `audit_event_property_category_idx`;
  - PR-B2 #110 (draft, `r5-b2` @ `c71ae350`): thân PR, `line-reduction.ts`, phần `folio-lines.service.ts`, `attention-sources.ts`, `reporting.module.ts`;
  - review đã có trên `main` @ `355a2929`, đọc để khớp thẻ: DOM `DOM-on-be-prs-101-108-110.md` (mục 2, 3.1, 3.3; thẻ 108-01, QA-BR438-01), SEC `SEC-on-be-prs-101-108.md` (mục 2, 3.1, 3.4; thẻ V516-01, V516-02).
- Đã chạy (worktree tách rời ở scratchpad, `b5f60440` gộp thử với `main` @ `ba2dc355`; Postgres 17 tạm trong Docker với mật khẩu CI-only của `ci.yml`, cổng riêng; đã dừng, xóa container và worktree; không chạm staging/production):
  - gộp với `main`: không xung đột; `tsc --noEmit` sạch;
  - 18 tệp test (505 ca) đạt: `v5-16-units`, `v5-16-line-reductions-filter`, `approvals-audit`, `bug-r4-038-internal-added-night`, `ota-prepaid-flow`, `minibar-m1`, năm tệp `s438-*`, `reversal-debt-g4`, `foc-debt-write-off-s4-bed`, `foc-resync`, `rbac-sprint3-beb`, `esc031-late-fee-post-review`, `folio-payments`, `module-boundaries`;
  - gộp thử thêm: #110 (`c71ae350`) tự gộp; #105 (`5aa19250`) xung đột ở `audit-log.controller.ts` (`boolQuery`), đúng như BE đã báo;
  - đột biến của ARC:
    - bỏ đi ngược chuỗi `related_line_id`: 1 ca đỏ;
    - bỏ audit khi hủy dòng trên folio mở: 4 ca đỏ;
    - bỏ loại trừ tiền phòng: 1 ca đỏ;
    - bỏ ghim `category = money`: 0 ca đỏ. Đột biến tương đương: `folio_line.adjusted` luôn thuộc `money`. Ghim chỉ để dùng chỉ mục, giữ;
    - `sameBusinessDay` theo ngày lịch thay vì ngày nghiệp vụ: **0 ca đỏ ở #108**. Các ca 23:50 → 00:20 → 06:10 của #110 bắt được (thẻ B1F-01).

## Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

**Gộp được ngay ở `b5f60440`** (là nền của #110). Mã đúng hợp đồng 0.3.13 mục 1.5, bổ sung 1 mục 1.20 và DOM 7.2 ý 1–2. Điều kiện ở mức tag:

- **ĐK-1:** không cắt tag v1.0.5 có #108 mà thiếu #110. Khớp thẻ SEC V516-02 (#108 và #110 lên cùng tag).
  - Lý do: #108 tính `before.rootLineManual = (source = manual)`, đúng chữ hợp đồng 1.20 nhưng sai ý DOM 7.2 ý 3 với dòng trả muộn B13/B15/B16 (lưu `source = manual`, xem mục 3.1).
  - Sau #110, audit và chốt chặn dùng chung `typedByHand`.
  - Nếu #110 trượt khỏi tag: BE-B thêm một commit trước tag, đổi `rootLineManual` sang `typedByHand(root.source, root.category)` (lấy hàm và `A30_CATEGORIES` của #110), kèm một ca dòng trả muộn B15 → `rootLineManual = false`.

Số thẻ:

- Trên PR: **0 Blocker · 0 Major · 1 Minor (B1F-01) · 1 Suggestion (B1F-02)**. Không thẻ nào chặn gộp.
- **Hai điểm của PR-B2 #110:**
  - điểm 1 (định nghĩa "gõ tay"): **chấp nhận**, mục 3.1;
  - điểm 2 (thêm `audit_event` vào `REPORTING_READ_TABLES`): **không chấp nhận như đang viết**, dùng cổng `audit/public`, mục 3.2, thẻ **FB-R5-ARC-BE-B2-01 (Major, cho #110)**.
- Mã lỗi của `action`: **chấp nhận** cách BE chọn (mục 2).
- ESC mới: không.

## 1. Đối chiếu hợp đồng và luật

| Việc | Nguồn | Mã ở PR | Kết quả |
|---|---|---|---|
| `action` nhiều giá trị, khớp đúng, ≤ 10, mã lạ → rỗng | 1.5; `listAuditEvents.action` (`maxItems: 10`, mẫu `^[a-z][a-z0-9_.]*$`, `maxLength: 60`) | `actionQuery`: một hay nhiều giá trị, bỏ trùng; `e.action = ANY($n::text[])` | Đúng (T16-2) |
| `removalsOnly` | 1.5; mô tả tham số | `after.amountVnd = 0`, dòng không phải `room`/`extra_person`/`room_change_difference`; so số an toàn (`jsonb_typeof = 'number'`) | Đúng (T16-1). An toàn hơn chữ hợp đồng `(after->>'amountVnd')::numeric`: dòng không có số không gây lỗi ép kiểu |
| `reductionsOnly` | 1.20; DOM 7.2 ý 1 | `after.amountVnd < before.amountVnd`, gồm lần bỏ dòng; không gồm lần tăng | Đúng (T16-1) |
| Ghim `category = money`, `action = folio_line.adjusted` | 1.20 (BE 20) | luôn ghim khi bật một trong hai cờ; client gửi khác → trang rỗng | Đúng. Dùng `audit_event_property_category_idx` (`property_id, category, occurred_at DESC`) |
| FD/FDL chỉ thấy bản ghi của mình | `x-scope own`; 1.5 | nhánh phạm vi giữ nguyên, `actorUserId` bị bỏ qua | Đúng (T16-3) |
| 5 khóa audit trên **mọi** `folio_line.adjusted` | 1.5; 1.20 | `origin` (vai lúc sửa + `lineOrigin`) đi vào đủ 4 chỗ ghi: folio mở có dòng thay thế, folio mở hủy/về 0 (mới), nhánh nợ, nhánh A32 | Đúng (T16-4, đọc lại từ `audit_event`) |
| Allowlist `folio_line` thêm 4 khóa | 1.20 | `audit-entities.ts` | Đúng. Chỉ id và đúng/sai, không thêm số tiền |
| Dòng gốc theo chuỗi `related_line_id` | 1.20 (BE 04); DOM 7.2 ý 2 | CTE đệ quy: cha cùng `category`, không phải dòng đảo, ≤ 200 bước. Cùng cách đi với `amountAtCheckout`. Dòng FOC/giảm giá khác loại nên chuỗi dừng | Đúng (ca C0313-04 ý 3 / T16-9) |
| `sameBusinessDay` theo ngày nghiệp vụ | DOM 3.1 (b), 3.3 (23:50 → 00:20 được, 06:10 bị chặn); BR-010 | `businessDate(root.posted_at, tz, rollover)` với rollover hiệu lực ngày ghi, so `today` (có rollover) | Đúng. Chưa có ca cửa sổ ở #108 (thẻ B1F-01) |
| Không migration | 1.5 | không | Đúng |

**Phần "sửa kèm" (hủy dòng hoặc về 0 trên folio mở nay ghi thêm `folio_line.adjusted` với `after.amountVnd = 0`): ARC đồng ý.**

- Không có bản ghi này thì `removalsOnly` không thấy đúng ca chính của FB-R4-SEC-BE-A31-01: lễ tân bỏ dòng.
- Nhất quán với lần sửa có dòng thay thế, vốn đã ghi hai bản ghi: `reverseLine` luôn ghi `folio.line_reversed`, rồi thêm `folio_line.adjusted`. Nay lần bỏ dòng cũng vậy.
- Ngoài bộ lọc và tập mã `money`, không chỗ nào khác trong `src` đếm `folio_line.adjusted`. ARC đã grep, nên không đếm đôi.

**Hiệu năng (G5):**
- Mỗi lần `adjust` thêm một truy vấn đệ quy theo khóa chính, độ dài bằng chuỗi sửa (thường 1–3), và tối đa hai lần đọc tham số. Không đáng kể so với các khóa đã lấy.
- Bộ lọc chạy trên chỉ mục `(property_id, category, occurred_at)`, khoảng ngày ≤ 92, so jsonb từng dòng. Ở quy mô 10 căn là nhỏ.
- QA chạy `EXPLAIN` trên staging theo C0313-20 ý 4, như BE đề nghị.

## 2. Mã lỗi của `action` – ARC chấp nhận, ghi vào hợp đồng

| Ca | Mã BE chọn | Ý ARC |
|---|---|---|
| Hơn 10 giá trị | 422 `VALIDATION_FAILED`, `errors[{field: action, code: VALUE_OUT_OF_RANGE}]` | Đồng ý. "Số ngoài biên" của bảng mã áp cho số lượng giá trị |
| Một giá trị dài hơn 60 ký tự | `TOO_LONG` | Đồng ý (bảng mã, V-01) |
| Sai mẫu, chuỗi rỗng | `VALIDATION_FAILED` | Đồng ý. Theo 0.3.7 bổ sung 3, sai dạng là `VALIDATION_FAILED`, không phải `REQUIRED`: tham số không bắt buộc |
| `removalsOnly`/`reductionsOnly` khác `true`/`false` | `VALIDATION_FAILED` | Đồng ý. Vắng hoặc rỗng → `false` |

ARC đưa bốn dòng này vào PR hợp đồng chữ kế tiếp (sau #111), dưới tham số `action`. Không đổi schema.

## 3. Trả lời hai điểm của PR-B2 #110 (để #108 và #110 dùng một định nghĩa)

### 3.1 `rootLineManual` = "dòng gốc gõ tay" (`typedByHand`) – **CHẤP NHẬN**

Định nghĩa của #110:
- dòng A30: `source = manual` và nhóm `addFolioLine` (`cleaning`, `laundry`, `penalty`, `damage`, `fnb`, `service_fee`);
- hoặc dòng đếm minibar: `source = minibar_check`, nhóm `minibar`.

Dòng luồng Desk tự ghi, dù lưu `manual`, là dòng hệ thống.

ARC đã đối chiếu với các chỗ ghi dòng trong mã (`main` @ `ba2dc355`):

| Dòng | Nơi ghi | `source` / `category` | DOM 7.2 ý 3 | `typedByHand` |
|---|---|---|---|---|
| Dòng lễ tân thêm (A30) | `folio-lines.service.ts` `addFolioLine` | `manual` / nhóm A30 | của người ghi | đúng |
| Dòng thay thế khi sửa | `folio-lines.service.ts` `adjust` | `manual` / như dòng cũ | xét dòng gốc | đi chuỗi tới dòng gốc |
| Phụ thu trả muộn B13/B15/B16 | `stay.service.ts` → `stay-support.ts` `replaceLateCharge` | **`manual`** / `late_checkout` | hệ thống, phải qua FOC (BR-438-04) | sai → đúng là hệ thống |
| Phụ thu nhận sớm | `checkin.service.ts` | `checkin` / `early_checkin` | hệ thống | hệ thống |
| Phí trả sớm, phí giữ lại | `stay.service.ts`, `checkout.service.ts` | `system`, `checkout` | hệ thống | hệ thống |
| Phí dọn từ yêu cầu khách | `guest-request-lifecycle.ts` | `guest_app` / `cleaning` | hệ thống | hệ thống |
| Đếm minibar | `minibar.service.ts` | `minibar_check` / `minibar` | của người đếm (ví dụ DOM 3.3) | của người đếm |

Lý do chấp nhận:
- Chữ hợp đồng "`source = manual`" sai ở dòng trả muộn, vì mã lưu `manual` từ R2. Chữ đó cũng không bao được ví dụ minibar của DOM 3.3: A30 không ghi nhóm `minibar`.
- Định nghĩa của #110 đúng ý DOM: "Dòng hệ thống tự ghi luôn đi FOC, dù người bấm thao tác sinh dòng là chính lễ tân đó".

Kèm theo:
- **Một định nghĩa, một chỗ:** `folio/public/line-reduction.ts` (`typedByHand`, `reductionScope`). Audit (`lineOrigin`) và chốt chặn đọc cùng `ReductionScope`, như #110 đã làm.
  - `A30_CATEGORIES` giữ bằng danh mục bằng test (#110 đã có).
  - Hợp đồng 0.3.14 có `FolioLine.reductionPolicy` (mục 1.25, danh sách 0.3.14). Trường này phải tính bằng đúng `frontDeskMayReduce`, không viết lại.
- **Hợp đồng (ARC):** sửa chữ 1.20 và mô tả `removalsOnly` ở 0.3.14 (ORC 07/11 ý 5), hoặc ở PR hợp đồng chữ sau #111 nếu PR đó đi trước:
  - "`before.rootLineManual` = dòng gốc do người gõ tay: dòng A30 (`source = manual`, nhóm của `addFolioLine`) hoặc dòng đếm minibar (`source = minibar_check`);
  - dòng do luồng Desk tự ghi, dù lưu `manual` (trả muộn B13/B15/B16), là dòng hệ thống".
- **0.3.14 (ARC):** xem lại nghĩa `source = manual` của dòng trả muộn khi thêm `FolioLine.source` chỉ đọc. Mục đích: client không hiểu nhầm dòng đó là "gõ tay". Không đổi dữ liệu cũ.
- **QA/DOM:** sửa oracle như #110 nêu:
  - BR-438-01, 02, 05: minibar là `minibar_check`;
  - BR-438-04: trả muộn lưu `manual` nhưng là dòng hệ thống.
- **Đếm lại minibar** (SEC V516-01, DOM 3.3 đã chốt luật, ORC giao BE-A2 ở `r5-v516-minibar`): lần đếm làm dòng nhỏ đi ghi một `folio_line.adjusted` (`reason: minibar_recount`). ARC thêm một yêu cầu kỹ thuật:
  - bản ghi đó mang đủ 5 khóa (`actorRole`, `postedByActor`, `sameBusinessDay`, `rootLineId`, `rootLineManual`), tính bằng cùng `rootLineOf` + `reductionScope` của #110. Nhờ vậy bộ lọc `reductionsOnly`, số đếm `line_reduction_count` và chốt chặn thấy lần đếm lại như mọi lần giảm khác;
  - test của BE-A2 đọc lại 5 khóa từ bảng `audit_event`, như T16-4.
- **ĐK-1** ở phần Kết luận áp cho #108.

### 3.2 `audit_event` vào `REPORTING_READ_TABLES` – **không chấp nhận như đang viết; đọc qua cổng `audit/public`**

ARC đồng ý số đếm `line_reduction_count` đọc từ audit `folio_line.adjusted` lúc đọc, đúng hợp đồng 1.20. ARC không đồng ý mở bảng `audit_event` cho mô hình đọc của `reporting`. Lý do và cách làm ở thẻ B2-01. Thay đổi nhỏ, không migration, không đổi hợp đồng.

SEC 3.4 đã chấp nhận truy vấn hiện tại **về bảo mật** (chỉ đọc `money` / `folio_line.adjusted`, chỉ trả số đếm) và để ARC duyệt quyền đọc của module. ARC không chấp nhận vì **ranh giới module** và vì cần **một định nghĩa** cho bộ lọc, cảnh báo, báo cáo ca. Hai ý kiến không mâu thuẫn.

## 4. Thẻ feedback

### FB-R5-ARC-BE-B1F-01
- Mức độ: Minor
- Vị trí:
  - `product/services/api/test/integration/v5-16-line-reductions-filter.test.ts` (T16-4);
  - ở #110: `test/v5-16-line-reduction.test.ts` ca "T16-8 / BR-438-03", `test/integration/v5-16-br438-guard.test.ts` ca T16-8.
- Vấn đề:
  - `coding-standards.md` mục 10 (dòng 142) ghi: "Mốc ngày nghiệp vụ 06:00 có test 05:59/06:00".
  - Bộ test của #108 không có ca trong cửa sổ 00:00–06:00. ARC đổi `sameBusinessDay` sang ngày lịch thì cả bộ vẫn xanh.
  - #110 có 23:50 → 00:20 (cùng ngày) → 06:10 (khác ngày), bắt được đột biến đó, nhưng chưa có đúng mốc 05:59/06:00.
- Vì sao quan trọng: sau #110, `sameBusinessDay` quyết định lễ tân được tự bỏ dòng hay phải xin FOC. Lệch một phút ở mốc rollover là sai quyền trên tiền.
- Đề xuất sửa: thêm vào ca T16-8 của #110 (đơn vị `reductionScope` và tích hợp): ghi 23:50 → bỏ lúc **05:59** được (`sameBusinessDay = true`), lúc **06:00** bị chặn 403. Nếu #108 còn push thì thêm cặp này vào T16-4. Không chặn gộp #108.
- Trạng thái: Open

### FB-R5-ARC-BE-B1F-02
- Mức độ: Suggestion
- Vị trí: bộ lọc "Bỏ/giảm dòng – 7 ngày" và "Sửa giảm dòng" trên Desk (FE-A), sổ tay quản lý (BA).
- Vấn đề:
  - Trước v1.0.5, hủy dòng trên folio mở chỉ ghi `folio.line_reversed`. Audit cũ cũng không có `before.actorRole` hay khóa dòng gốc.
  - Vì vậy `removalsOnly`/`reductionsOnly` chỉ đủ dữ liệu từ ngày v1.0.5 lên. `line_reduction_count` của #110 cũng không đếm bản ghi cũ, như BE đã ghi.
- Vì sao quan trọng: tuần đầu sau khi lên, quản lý mở bộ lọc 7 ngày sẽ thấy ít hơn thực tế mà không biết vì sao.
- Đề xuất sửa:
  - FE-A/UXD ghi một dòng phụ dưới bộ lọc khi khoảng ngày bắt đầu trước ngày lên: "Dữ liệu từ ngày dd/mm". BA ghi vào sổ tay: trước ngày đó, xem `folio.line_reversed` trong Nhật ký.
  - **Không** bù audit cũ, vì bảng chỉ thêm và audit phải là việc đã xảy ra.
- Trạng thái: Open

### FB-R5-ARC-BE-B2-01 (cho PR-B2 #110 – sửa trước khi chuyển ready)
- Mức độ: Major
- Vị trí (ở `r5-b2` @ `c71ae350`):
  - `product/services/api/src/modules/reporting/reporting.module.ts` (thêm `audit_event` vào `REPORTING_READ_TABLES`);
  - `reporting/internal/attention-sources.ts` (truy vấn đếm (d));
  - `audit/internal/audit-log.controller.ts` (`reductionsOnly`, `ROOM_MONEY_CATEGORIES`);
  - `folio/public/line-reduction.ts` (`NIGHT_LINE_CATEGORIES`).
- Vấn đề:
  1. **Ngoại lệ đọc thẳng không áp ở đây.** `architecture.md` 5.1 cho `reporting` đọc thẳng bảng của module khác chỉ vì KPI và "Cần chú ý" cần gộp nhiều bảng trong một truy vấn để giữ p95 < 300 ms. Số đếm này chỉ đọc một bảng, nên áp quy tắc mặc định: đọc giá trị qua cổng `public` của module chủ.
  2. **Mở cả bảng nhạy cảm.** `audit_event` có `ip_hmac`, `session_id`, `trusted_device_id`, `reason` (chữ tự do). Danh sách C5 khai theo bảng, không theo cột, nên thêm tên bảng là cho cả module đọc mọi cột, hôm nay và về sau.
  3. **Hai bản chép của cùng một định nghĩa.**
     - Bộ lọc `reductionsOnly` (controller) xét `after.category` với `ROOM_MONEY_CATEGORIES`.
     - Số đếm (reporting) xét `before.category` với `NIGHT_LINE_CATEGORIES` và `before.actorRole`.
     - Mục "Cần chú ý" dẫn sang chính bộ lọc đó. Hai bản lệch nhau thì số trên mục và số dòng quản lý thấy khi bấm vào không khớp (BR-438 (4)(iii)).
  4. `ShiftReport.lineReductions[]` (v1.0.6) sẽ cần cùng định nghĩa lần thứ ba.
- Vì sao quan trọng: giữ ranh giới module mà test kiến trúc đang bảo vệ, không mở rộng bề mặt đọc của bảng audit. Một định nghĩa "sửa giảm dòng phát sinh" cho bộ lọc, cảnh báo và báo cáo ca.
- Đề xuất sửa (không migration, không đổi hợp đồng; BE-H khoảng 0,25 ngày; phần lớn là chuyển mã có sẵn):
  - tạo `modules/audit/public/line-reductions.ts` gồm:
    - `LINE_REDUCTION_ACTION`;
    - một danh sách nhóm dòng đêm. `folio/public/line-reduction.ts` import danh sách này, hoặc giữ bằng nhau bằng test. Không cho `audit` import `folio`;
    - `lineReductionWhere(alias, ph, { removalsOnly })` trả các mệnh đề SQL: ghim `money` + action, loại dòng đêm, so số an toàn;
    - `countLineReductionsByActor(tx, { from, to, actorRoles, above })` → `{ actorUserId, n }[]`. Hàm chỉ đọc `actor_user_id` và các khóa allowlist của `before`/`after`;
  - `audit-log.controller.ts` dùng `lineReductionWhere`. `attention-sources.ts` gọi `countLineReductionsByActor`;
  - **giữ nguyên** `REPORTING_READ_TABLES`, không có `audit_event`;
  - test đối chiếu: cùng dữ liệu tháng, số đếm của một FD = số dòng `listAuditEvents?reductionsOnly=true&actorUserId=…&from=…&to=…` (chỉ bản ghi vai lúc sửa FD/FDL). Khi `r5-v516-minibar` gộp, thêm một lần đếm lại minibar vào dữ liệu của ca này;
  - `link` của mục: nên dùng `from`/`to` của tháng nghiệp vụ (tham số sẵn có của `listAuditEvents`) thay `month=YYYY-MM`, để FE-A không cần thêm tham số. FE-A xác nhận;
  - ARC cập nhật `architecture.md` 5.1: `reporting` đọc audit qua `audit/public` (PR tài liệu của ARC).
- Trạng thái: Open

## 5. Ghi chú cho ORC – thứ tự gộp

1. #108 gộp ngay (merge commit).
2. #110 gộp `main` lại, sửa B2-01 (và B1F-01), chuyển ready. SEC, DOM, QA review. Gộp trước khi cắt tag (ĐK-1).
3. #105 (V5-48) xung đột với #108 ở `audit-log.controller.ts`. PR nào gộp sau thì gộp `main` vào và giữ **một** `boolQuery`. Nếu #110 đã chuyển phần lọc sang `audit/public/line-reductions.ts` thì `boolQuery` có thể ở lại controller.
4. Danh sách chữ hợp đồng ARC làm ở 0.3.14 (hoặc PR chữ sau #111 nếu đi trước), chỉ chữ:
   - mã lỗi `action` (mục 2);
   - nghĩa `rootLineManual` (mục 3.1);
   - `commission` khi `status ≠ computed` và khóa hoa hồng chỉ OWN/MGR thấy (review #101, thẻ H1-01).

## 6. Điểm làm tốt

- Tách đúng ranh giới PR-B1/PR-B2: phần lọc và khóa audit đứng riêng, có test. Các ca do MGR làm vẫn đúng sau khi #110 chặn FD, nên test #108 không phải viết lại.
- Khóa audit được **đọc lại từ bảng `audit_event`**, không chỉ kiểm phản hồi API. Như vậy allowlist SR-AUD-03 được kiểm thật. Ca hai bước C0313-04 ý 3 chứng minh không lách được bằng "tăng dòng người khác rồi bỏ dòng thay thế".
- So jsonb an toàn kiểu (`jsonb_typeof = 'number'`) thay cho ép kiểu thẳng. Bản ghi audit cũ hay lạ không làm bộ lọc trả 500.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review PR #108 (BE-B PR-B1 phần lọc, V5-16) @ b5f60440: DUYỆT CÓ ĐIỀU KIỆN** (rounds/round-05/reviews/ARC-on-be-pr-108-b1-filter.md). Đúng 0.3.13 1.5, 1.20, DOM 7.2 ý 1–2; gộp được ngay. ĐK-1: không cắt tag v1.0.5 có #108 mà thiếu #110 (hoặc commit đổi rootLineManual sang typedByHand + ca trả muộn B15). ARC chấp nhận mã lỗi action (>10 VALUE_OUT_OF_RANGE, >60 TOO_LONG, sai mẫu/rỗng VALIDATION_FAILED) và việc hủy dòng trên folio mở ghi folio_line.adjusted (after 0). Đếm lại minibar (BE-A2 r5-v516-minibar): bản ghi minibar_recount mang đủ 5 khóa audit, tính bằng rootLineOf + reductionScope của #110. **Trả lời #110:** (1) CHẤP NHẬN rootLineManual = typedByHand (A30 source manual + nhóm addFolioLine, hoặc minibar_check); dòng trả muộn B13/B15/B16 lưu manual là dòng hệ thống; một định nghĩa ở folio/public/line-reduction.ts cho audit và chốt chặn; ARC sửa chữ 1.20 + removalsOnly. (2) KHÔNG thêm audit_event vào REPORTING_READ_TABLES: **FB-R5-ARC-BE-B2-01 (Major, #110)** – đếm line_reduction_count qua cổng audit/public/line-reductions.ts dùng chung mệnh đề với reductionsOnly, test đối chiếu số đếm = số dòng bộ lọc; ARC cập nhật architecture 5.1. Thẻ khác: B1F-01 (Minor, ca 05:59/06:00), B1F-02 (Suggestion, dữ liệu bộ lọc từ ngày lên). | ARC | Không ESC |`
