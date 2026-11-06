# ARC review PR #135 (BE-A2, bổ sung sau #99) và PR #139 (BE-B, chứng từ đơn đã đóng theo vai người tải ảnh)

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- **#135** `r5-a2-followup` @ **`a6ab1900`** (draft). Thẻ ARC A2-03, A2-04 (`ARC-on-be-pr-99-delta.md`) và SEC 99D-01.
  - HEAD lúc ghi: `40e43932`, chỉ gộp `main` @ `bd5c9dcc`. Patch của PR (2 tệp) có patch-id **trùng** bản `a6ab1900`, nên kết luận áp cho cả hai SHA.
- **#139** `r5-v5-48-proof-role` @ **`97f03a65`** (draft). Thẻ FB-R5-SEC-BE-105-01.
  - Gồm `685e5538` (mã + test) và một lần gộp `main` sau khi #105 vào (`391937fe`).

**Đã đọc:**
- #135: diff so với gốc gộp `92d16358` (2 tệp, +67/−7).
  - `checkout.service.ts`: `overdueStay`, `overdueGate`, `checkOut` (đọc không khóa → khóa đơn, khóa đơn con → đọc lại → 409);
  - `shared/http/unit-of-work.ts`: khóa idempotency lăn ngược khi lỗi;
  - `audit-log.controller.ts`: `boolQuery`;
  - hợp đồng `listAuditEvents.overdueOnly`.
- #139: diff so với gốc gộp `6d32ef25` (2 tệp, +80/−8).
  - `payments.service.ts`: `recordAfterClosure`, `SALES_ROLES`;
  - `payments/public/attachment-usage.ts` (cổng sang files);
  - `files/public/attachment.service.ts`: `upload`, `UPLOAD_ROLES`, `primaryRole`, `visibleRow`;
  - `shared/http/auth.guard.ts`: cách nạp vai;
  - `identity/internal/users.service.ts` `checkRoles`;
  - `architecture.md` 5.1 (bảng có một module chủ);
  - hợp đồng `recordPayment` 0.3.13 bổ sung 1 (A), `createDepositNotice`;
  - SEC 105-01 (`SEC-on-prs-105-119-125-128.md`).

**Đã chạy:**
- **Môi trường:** hai worktree tách riêng, ở đúng `a6ab1900` và `97f03a65`. `pnpm install --offline`. Postgres `17-alpine` dùng một lần ở cổng `127.0.0.1` riêng; vai tạo bằng `02-roles.sh` với mật khẩu CI có sẵn trong `ci.yml`.
- **#135:** 3 tệp V5-15 (`v105-overdue-checkout`, `v105-overdue-checkout-units`, `v105-commission-anchor`): **43/43 đạt** (41 ca cũ + 2 ca mới). 6 đột biến (mục 1.3).
- **#139:**
  - 6 tệp (`v5-48-closed-booking-money`, `v5-48-units`, `files-attachments`, `payments-s3`, `folio-payments`, `checkin-payment`): **90/90 đạt**;
  - 11 tệp khác có ghi tiền hoặc ảnh (`v104-holds*`, `rbac-sprint2-beb`, `rbac-sprint3-beb`, `reversal-debt-g4`, `s4-recheck6-be-a`, `s4-stab-be-a`, `s438r4-money`, `s438-r8/r3-add3-settled-credit`, `foc-keys-s4`, `module-boundaries`): **555/555 đạt**;
  - `tsc --noEmit`, ESLint, Prettier sạch trên tệp đổi;
  - 4 đột biến và một ca dò vai ghép (mục 2.3). Ca dò viết tạm, không commit.
- `git merge-tree` của cả hai PR với `main` @ `74189d2c`: sạch.
- **Dọn dẹp:** đã xóa container và hai worktree.

**CI:**
- #135, run `42277733312` @ `a6ab1900`:
  - xanh: `format · lint · audit · test · build`, API contract, OpenAPI lint, gitleaks, landing, confidential paths;
  - `docker images build · E2E smoke` **đỏ** ở hai ca guest-web: H18 TC-L7-053 (lần đầu) và V5-46-2 (cả hai lần, `locator.click` hết giờ). Đây là lỗi bộ đếm mở trang khách (429). `main` đã sửa ở `1caa22f4` và `1ed9ac0e`; `a6ab1900` chưa có hai commit này, `40e43932` đã có. PR không chạm guest-web hay bộ đếm;
  - run `42284439093` @ `40e43932` đang chạy lúc ghi.
- #139, run `42280525646` @ `97f03a65`:
  - xanh: build-test (toàn bộ unit và integration), API contract, OpenAPI lint, gitleaks, confidential paths;
  - E2E đang chạy lúc ghi. Lưu ý: `97f03a65` **chưa có** `1caa22f4` và `1ed9ac0e`, nên hai ca guest-web trên có thể đỏ lại.
- Job `infra scripts (shellcheck)` đỏ ở bước `postgres-log-terse` trên cả hai: chập chờn đã biết FB-R5-ARC-OPS-11, #126 sửa. Không tính.

## 0. Kết luận

| PR | SHA | Kết luận | Điều kiện gộp |
|---|---|---|---|
| **#135** | `a6ab1900` (= `40e43932` về mã) | **DUYỆT CÓ ĐIỀU KIỆN** | (1) sửa FB-R5-ARC-BE-135-01, chỉ một chỗ trong test; (2) build-test và E2E xanh ở SHA cuối |
| **#139** | `97f03a65` | **DUYỆT CÓ ĐIỀU KIỆN** | (1) sửa FB-R5-ARC-BE-139-01: đọc vai người tải qua cổng `AttachmentUsage`, không đổi hành vi; (2) gộp `main` (để có bản sửa E2E guest-web), build-test và E2E xanh ở SHA cuối |

**Thẻ mới:** 0 Blocker · 1 Major (139-01) · 2 Minor (135-01, 139-02) · 2 Suggestion (135-02, 139-03). ESC mới: **không**.

- Vì sao 135-01 là điều kiện dù chỉ Minor: PR này sinh ra để khóa A2-04 bằng test, mà ca hiện tại không phân biệt được "rỗng → false" với "rỗng → true". Sửa một dòng. ARC đã thử bản sửa ở máy (mục 1.3).
- **Thẻ cũ:**
  - FB-R5-ARC-BE-A2-03: **Done khi #135 gộp**. Đột biến "bỏ header" nay đỏ.
  - FB-R5-ARC-BE-A2-04: mã đúng. **Done khi #135 gộp kèm 135-01**.
  - SEC 99D-01: ARC xác nhận ca test phủ đủ hai ý của SEC. SEC đóng thẻ của SEC.
  - SEC 105-01: ARC xác nhận mã đúng đề xuất SEC, đủ ba ca SEC nêu. SEC đóng thẻ của SEC.

## 1. PR #135

### 1.1 A2-03 / SEC 99D-01: ca 409 dưới khóa

| Điểm cần kiểm | Mã / test @ `a6ab1900` | Kết quả |
|---|---|---|
| Spy có chạy đúng lần đọc dưới khóa không | `checkOut` gọi `overdueStay` đúng hai lần:<br>– lần 1 trong `overdueGate`, đọc đơn không khóa;<br>– lần 2 ở dòng 1228, sau `loadReservation(..., { forUpdate: true })` và `children()`.<br>Spy để lần 1 chạy thật (`real.apply(this, a)`), lần 2 trả `null`. Test kiểm `calls === 2`.<br>Đột biến M3 bỏ lần đọc lại (`locked = overdue`) → ca đỏ. Vậy ca dựa đúng vào lần đọc dưới khóa, không phải lần đọc nào khác | Đúng |
| Khe tranh chấp giả có giống thật không | Hợp đồng 1.18: B13 kiểu OTA thêm đơn con mà không đổi `version` đơn chính. Lần đọc dưới khóa thấy "hết quá ngày đi", `If-Match` vẫn khớp. Spy trả `null` đúng là trạng thái đó | Đúng |
| 409 `CONCURRENT_UPDATE` + `Retry-After: 1`, không ghi gì | Kiểm `statusCode`, `code`, `headers['retry-after'] === '1'`. `snapshot(s6)` (đơn, folio, dòng, khoản thu) trước = sau. `overdueAudit(s6)` rỗng | Đúng. M1 (bỏ header) → đỏ |
| Gửi lại cùng `Idempotency-Key` chạy lại trên trạng thái mới | `unit-of-work.ts`: khóa ghi `in_progress` là lần ghi đầu của giao dịch, lỗi ném ra thì lăn ngược cả khóa. Chỉ `{ fail }` (commit-then-fail) mới lưu lỗi, và `checkOut` không dùng. Test: lần 2 → 200, không có `Idempotent-Replayed`, đơn `checked_out`, đúng một audit quá ngày đi. Lần 3 → 200 kèm `Idempotent-Replayed: true`, vẫn một audit | Đúng. Nếu sau này 409 bị lưu vào khóa thì lần 2 đỏ, đúng lo ngại của SEC |
| Spy không rò sang ca khác | `mockRestore()` trong `finally`, trước lần gửi thứ 2. Vitest tách tiến trình theo tệp | Đúng |

Giới hạn, không lập thẻ: spy đếm theo thứ tự gọi. Nếu ai dời lần đọc lại lên **trước** khóa đơn, ca vẫn xanh. Test tích hợp không thấy được thứ tự khóa với chi phí hợp lý. Chỗ này giữ bằng chú thích ở dòng 1223–1227 và review.

### 1.2 A2-04: `overdueOnly` qua `boolQuery`

- `audit-log.controller.ts` 142: `const overdue = boolQuery('overdueOnly', overdueOnly);`. Khối kiểm riêng đã bỏ.
- Vị trí kiểm vẫn trước `actorUserId`, nên thứ tự lỗi không đổi.
- Giá trị khác `true`/`false`, kể cả mảng khi gửi lặp tham số, vẫn → 422 với `field = overdueOnly`, `code = VALIDATION_FAILED`. Ca `overdueOnly=yes` cũ vẫn đạt.
- Đúng hợp đồng: `{ type: boolean, default: false }`.
- Gộp với `main`: `main` đã có `afterClosureOnly` (#105) cũng qua `boolQuery`. Gộp sạch, sau gộp cả bốn tham số boolean đọc chung một cách.
- Test: xem thẻ 135-01.

### 1.3 Đột biến của ARC (#135)

| Đột biến | Kết quả |
|---|---|
| M1: bỏ `Retry-After` (BE nêu) | **1 đỏ** (ca A2-03) |
| M2: trả lại khối kiểm cũ của `overdueOnly` (BE nêu) | **1 đỏ** (ca A2-04) |
| M3: không đọc lại dưới khóa (`locked = overdue`) | **1 đỏ**. Spy chạy đúng đường có khóa |
| M4: phép so dưới khóa không bao giờ ném lỗi | **1 đỏ** |
| M5: `overdueOnly` rỗng → `true` | **sống** (thẻ 135-01). Với bản sửa ARC đề xuất: ca đạt trên mã PR, M5 **đỏ** |
| M6: bỏ vế `locked.departureDate !== overdue?.departureDate` | **sống** (thẻ 135-02, có từ #99) |

Bắt được 4/6. Hai đột biến của BE đều đỏ đúng như BE báo.

## 2. PR #139

### 2.1 Hợp đồng

| Điểm | Mã @ `97f03a65` | Kết quả |
|---|---|---|
| Mã lỗi, status, field | 422 `VALIDATION_FAILED`, `errors[{ field: attachmentId, code: NOT_IN_LIST }]`. Giống hệt luật S7 của hợp đồng 0.3.13 bổ sung 1 (A) và giống lỗi "ảnh không thuộc đơn này" của `assertUsable` | Đúng. Không ai đoán được qua mã lỗi ai đã tải ảnh |
| Thứ tự kiểm | Hợp đồng: 403 theo vai → 404 theo phạm vi → luật đơn đã đóng → luật còn lại. Câu mới nằm trong luật đơn đã đóng, sau `method`/`REQUIRED`, trước `recordInTx` | Đúng |
| Không ghi gì khi từ chối | Ném lỗi trước `recordInTx`. Test so `snapshot` (khoản thu, QR chờ, audit tiền, `version` folio, ảnh đã gắn) trước = sau, với cả 3 ảnh × 4 vai | Đúng |
| Nghĩa luật | Từ chối khi ảnh đang ở một tin báo, **hoặc** `uploaded_by_role` ∈ `SALES_ROLES` (`sales_staff`, `collaborator`; cột có từ migration 0050). Đúng đề xuất SEC 105-01, khớp DOM 11.4 2(c). Câu `deposit_notice` cũ vẫn giữ, như SEC cho phép | Đúng |
| Chữ hợp đồng | (A) hiện ghi "ảnh đã gắn vào một báo 'khách đã chuyển'" kèm câu nghĩa "không ảnh sale/CTV chuyển tiếp". Hành vi mới đúng câu nghĩa nhưng rộng hơn câu luật | ARC ghi lại ở 0.3.14, chỉ chữ (mục 4). Không chặn |
| Migration, schema | Không | Đúng |

### 2.2 Luồng có sẵn có bị chặn không

- **Đơn đang mở** (`hold`, `confirmed`, `in_house`, B4 xác nhận cọc bằng ảnh sale): không đổi.
  - Câu mới chỉ chạy trong `recordAfterClosure`. Hàm này chỉ được gọi ở dòng 308 (`if (closed) …`).
  - 555/555 ca ghi tiền và ảnh của các tệp khác đạt.
- **Ảnh do quầy tải** (FD, FDL, MGR, OWN, người chỉ một vai):
  - `uploaded_by_role` là vai quầy → nhận như trước, khoản thu `pending`;
  - test có ca FD → 201;
  - đột biến N4 (từ chối mọi người tải) làm đỏ 5 ca: (h2) FD/FDL/MGR/OWN, `afterClosureOnly`, SEC 1.2/1.3, (h6), ca mới. Luồng quầy có test bảo vệ.
- **Người có nhiều vai**: có một lệch, xem thẻ 139-02.

### 2.3 Đột biến và ca dò (#139)

| Đột biến / ca dò | Kết quả |
|---|---|
| N1: vế `uploaded_by_role` luôn sai (BE nêu "bỏ điều kiện") | **1 đỏ** (ca mới) |
| N4: vế vai khớp mọi người tải, kể cả quầy | **5 đỏ** |
| N2: bỏ vế `deposit_notice`, chỉ giữ luật vai | **sống**. Đúng dự kiến: người một vai thì ảnh trên tin báo luôn do sale/CTV tải (sale chỉ thấy ảnh của mình – `visibleRow`) (thẻ 139-03) |
| N3: danh sách vai bỏ `collaborator` | **sống**. Không ca nào có ảnh CTV tải (thẻ 139-03) |
| Dò: người FD tải ảnh với vai theo thứ tự guard trả về | `collaborator+front_desk` → ghi `collaborator` → **422**<br>`front_desk+sales_staff` → ghi `front_desk` → **201**<br>`front_desk` → **201**<br>(thẻ 139-02) |

### 2.4 Phân lớp

- `payments` đọc thẳng bảng `attachment` của module `files` (thẻ 139-01).
- Câu đọc `deposit_notice` là bảng của chính `payments`, theo erd mục `deposit_notice`. Đúng.
- Hiệu năng: thêm một tra theo khóa chính trong cùng câu. Không đáng kể.

## 3. Thẻ

### FB-R5-ARC-BE-135-01
- Mức độ: Minor
- Vị trí: `product/services/api/test/integration/v105-overdue-checkout.test.ts` 395–403 (@ `a6ab1900`), ca "FB-R5-ARC-BE-A2-04: overdueOnly empty reads as false…"
- Vấn đề:
  - Ca so `ids('&overdueOnly=')` với `ids('')` trên khoảng `from=2029-01-01&to=2029-01-31`.
  - Ca nằm trong khối `listAuditEvents.overdueOnly`, chạy **trước** khối B18 là khối tạo dữ liệu tháng 01/2029. Lúc ca chạy, khoảng đó chưa có bản ghi nào, nên hai bên đều là `[]`.
  - Kết quả: ca chỉ chứng minh "rỗng → 200", không chứng minh "rỗng → false". Đột biến M5 (rỗng → `true`) sống.
- Vì sao quan trọng: nếu đọc sai thành `true`, Desk/báo cáo gửi ô lọc để trống sẽ chỉ thấy các lần trả phòng quá ngày đi mà không biết. A2-04 là lý do có ca này.
- Đề xuất sửa (chỉ test):
  - dùng khoảng 11/12/2028 của chính khối, qua helper `list` có sẵn. Ngày đó có 5 bản ghi, trong đó 2 bản quá ngày đi;
  - so `list('own', 'overdueOnly=')` với `list('own', '')`, thêm `expect(rows.length).toBeGreaterThanOrEqual(5)`;
  - giữ dòng ghép `&removalsOnly=&reductionsOnly=` trên cùng khoảng.
  - ARC đã thử: đạt trên mã PR, M5 đỏ.
- Trạng thái: Open

### FB-R5-ARC-BE-135-02
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/frontdesk/internal/checkout.service.ts` 1229 (@ `a6ab1900`, có từ #99); `v105-overdue-checkout.test.ts` ca A2-03
- Vấn đề: vế "dưới khóa vẫn quá ngày đi nhưng **ngày đi khác**" (`locked.departureDate !== overdue?.departureDate`) chưa có ca nào. Bỏ vế này thì không ca nào đỏ (M6).
- Vì sao quan trọng: đây là đúng kiểu đơn con OTA gia hạn thêm một đêm mà đơn vẫn quá ngày đi. Khi đó `nightsNotBilled` và trần đêm của MGR đổi, nên thân lệnh đã đọc theo luật cũ.
- Đề xuất sửa: thêm một biến thể của spy. Lần gọi 2 trả `{ departureDate: <ngày khác>, nights: <n> }` → 409 `CONCURRENT_UPDATE` + `Retry-After: 1`, không ghi gì. Cùng PR nếu tiện. Không chặn.
- Trạng thái: Open

### FB-R5-ARC-BE-139-01
- Mức độ: Major
- Vị trí:
  - `product/services/api/src/modules/payments/internal/payments.service.ts` 412–424 (@ `97f03a65`, `recordAfterClosure`);
  - cổng `payments/public/attachment-usage.ts`;
  - `files/public/attachment.service.ts` (`FilesModule` gắn `ATTACHMENT_USAGE` → `AttachmentService`).
- Vấn đề:
  - Câu mới đọc thẳng bảng `attachment` để lấy `uploaded_by_role`. Bảng này thuộc module `files` (BE-C; erd mục `attachment`).
  - Tìm `FROM attachment` / `JOIN attachment` trong `src`: ngoài `modules/files`, chỉ có dòng 415 này.
  - Mọi chỗ khác của `payments` đi qua cổng `AttachmentUsage` (`assertUsable`, `bindTo`, `setRetentionAnchor`).
  - `architecture.md` 5.1: bảng có **một** module chủ; module khác đọc giá trị nghiệp vụ qua cổng. Ngoại lệ chỉ có mô hình đọc `reporting`. Cùng loại với FB-R5-ARC-BE-B2-01 (Major, #110).
- Vì sao quan trọng:
  - (a) Luật "ảnh nào làm chứng từ được" phụ thuộc cách `files` ghi `uploaded_by_role` (thẻ 139-02). Để ở `payments` thì `files` đổi cách ghi sẽ làm luật lệch mà không test nào đỏ.
  - (b) PR-B3 (BE-D) dựng tiếp trên đúng hàm này (5B-1). Sửa bây giờ rẻ hơn sau.
- Đề xuất sửa (không đổi hành vi, mã lỗi hay test; BE-B, chừng 30 phút):
  - thêm vào `AttachmentUsage` một hàm, ví dụ `uploadedBySales(tx, id): Promise<boolean>`. Hàm trả `true` khi vai lúc tải là sale/CTV. Id không thấy theo RLS → `false`, để `assertUsable` phía sau trả `NOT_IN_LIST` như nay;
  - `AttachmentService` cài hàm này, danh sách vai để ở `files`;
  - `payments` giữ câu `deposit_notice` (bảng của mình) và gọi cổng;
  - tùy chọn: `module-boundaries.test.ts` thêm ca "không câu SQL nào trên `attachment` ngoài `modules/files`".
- Trạng thái: Open

### FB-R5-ARC-BE-139-02
- Mức độ: Minor
- Vị trí:
  - `product/services/api/src/modules/files/public/attachment.service.ts` 197 và 440–442 (@ `97f03a65`): `primaryRole(roles, allowed)` lấy vai **đầu tiên của mảng** nằm trong danh sách được tải;
  - `shared/http/auth.guard.ts` 540–541: vai nạp `ORDER BY role`, tức theo chữ cái.
- Vấn đề:
  - `uploaded_by_role` phụ thuộc thứ tự chữ cái của tên vai. `users.service.ts` `checkRoles` cho ghép vai bất kỳ. Ca dò của ARC (mục 2.3):
    - người `collaborator` + `front_desk` tải ảnh báo có ngân hàng → ghi `collaborator` → **422**;
    - người `front_desk` + `sales_staff` → ghi `front_desk` → **201**.
  - Trong khi đó `payment.recorded_by_role` (`payments/public/payment.service.ts`, `primaryRole` theo `ROLE_ORDER`) và `actorRoleOf` của audit đều xếp vai quầy trước.
  - Trước #139 cột này chỉ được ghi, không ai đọc. #139 biến nó thành căn cứ chặn.
- Vì sao quan trọng: hai người cùng kiểu "quầy kiêm bán" bị xử ngược nhau. Người quầy kiêm CTV không tự ghi được khoản thu nào trên đơn đã đóng, phải nhờ người khác tải ảnh. Hiếm ở OTTIMO, nhưng API cho phép.
- Đề xuất sửa:
  - một luật thứ tự cố định cho ảnh: `primaryRole` của `files` chọn theo danh sách thứ tự (vai quầy trước, như `ROLE_ORDER`), không theo thứ tự mảng;
  - chỉ áp cho ảnh tải mới, không migration;
  - **SEC chốt nghĩa**: (a) vai quầy được ưu tiên – ARC đề xuất, khớp `recorded_by_role`; hay (b) có vai sale/CTV là từ chối;
  - làm cùng 139-01 nếu kịp. Không kịp thì sang v1.0.6, ghi backlog.
- Trạng thái: Open

### FB-R5-ARC-BE-139-03
- Mức độ: Suggestion
- Vị trí: `product/services/api/test/integration/v5-48-closed-booking-money.test.ts` 547–610 (@ `97f03a65`)
- Vấn đề: hai đột biến sống.
  - N3: bỏ `collaborator` khỏi danh sách vai. Không ca nào có ảnh CTV tải lên.
  - N2: bỏ vế `deposit_notice`. Với người một vai thì vế này chỉ là lớp phòng thêm. Chỉ người sale+FD (đọc được ảnh quầy) mới gắn được ảnh quầy vào tin báo.
- Vì sao quan trọng: CTV là một nửa của luật SEC 105-01. Một lần dọn `SALES_ROLES` sau này có thể bỏ sót mà không ai thấy.
- Đề xuất sửa: thêm một ảnh do CTV tải lên (trên đơn của CTV) vào ca cuối. Nếu làm 139-01 thì một test đơn vị cho hàm cổng với hai vai `sales_staff`, `collaborator` là đủ. Không chặn.
- Trạng thái: Open

## 4. Việc của ARC sau khi gộp

Hợp đồng 0.3.14 (chỉ chữ):
- `recordPayment` (A): "ảnh do sale/CTV tải lên (vai lúc tải – `attachment.uploaded_by_role`), dù đang ở tin báo, đã bị thay hay chưa gửi, hoặc ảnh đang ở một tin báo → 422 `NOT_IN_LIST` (`attachmentId`)";
- erd mục `attachment`: nghĩa "vai lúc tải" theo kết quả 139-02 khi SEC chốt.

## 5. Điểm làm tốt

- #135:
  - giả khe tranh chấp bằng spy đúng một lần gọi, nhưng vẫn chạy qua controller, unit-of-work và khóa thật;
  - ca kiểm cả ba lần gửi cùng khóa: 409, chạy lại, phát lại. Ca này khóa luôn hành vi "lỗi không lưu vào khóa idempotency" mà trước đây chỉ có chú thích.
- #139:
  - luật đúng một câu SQL, đặt trước `recordInTx`;
  - test đọc lại bảng `deposit_notice` để khẳng định ảnh 1 đã bị thay thật;
  - chạy cả 4 vai quầy với từng ảnh và so ảnh chụp trạng thái, không chỉ so mã lỗi.

## 6. Giả định

- G1: E2E của `40e43932` (#135) và `97f03a65` (#139) chưa xong lúc ghi. Kết luận dựa trên build-test xanh trên CI, lần chạy của ARC và việc hai ca guest-web đỏ ở `a6ab1900` là lỗi bộ đếm đã sửa trên `main`.
- G2: Postgres ARC dùng là `postgres:17-alpine` bản có sẵn ở máy. ID image (`b0f9560a2de0`) trùng phần đầu digest CI ghim trong `ci.yml`.
- G3: ca dò vai ghép truyền thẳng mảng vai vào `AttachmentService.upload` theo đúng thứ tự `auth.guard.ts` trả về (`ORDER BY role`). ARC không tạo người dùng nhiều vai qua API.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review PR #135 (BE-A2, bổ sung #99) @ a6ab1900 (HEAD 40e43932 chỉ gộp main, patch-id trùng): DUYỆT CÓ ĐIỀU KIỆN; PR #139 (BE-B, SEC 105-01) @ 97f03a65: DUYỆT CÓ ĐIỀU KIỆN.** #135: ca A2-03/99D-01 dùng spy overdueStay ở lần đọc dưới khóa (calls = 2; đột biến bỏ lần đọc lại → đỏ) → 409 CONCURRENT_UPDATE + Retry-After: 1, không ghi gì; gửi lại cùng Idempotency-Key chạy lại (200, không Idempotent-Replayed), lần 3 mới phát lại; A2-04 overdueOnly qua boolQuery (rỗng → false, 422 giữ field). ARC chạy 43/43 ca V5-15, đột biến 4/6 (bỏ header, kiểm cũ: đỏ; rỗng → true sống vì ca A2-04 so hai danh sách rỗng – 135-01 Minor, điều kiện; vế departureDate dưới khóa chưa test – 135-02 Suggestion). E2E đỏ ở a6ab1900 = ca guest-web 429 đã sửa trên main (1caa22f4, 1ed9ac0e); gộp khi 135-01 xong và build-test + E2E xanh ở SHA cuối. A2-03 Done khi gộp, A2-04 Done khi gộp kèm 135-01. #139: recordAfterClosure từ chối ảnh do sale/CTV tải (uploaded_by_role) hoặc ảnh đang ở tin báo, 422 attachmentId NOT_IN_LIST, trước recordInTx, không ghi gì; luồng đơn mở và ảnh quầy không đổi (90/90 + 555/555 ca, đột biến chặn mọi người tải → 5 đỏ). 139-01 Major (điều kiện): payments đọc thẳng bảng attachment của files – đưa qua cổng AttachmentUsage (architecture 5.1), không đổi hành vi; 139-02 Minor: uploaded_by_role theo thứ tự chữ cái của vai (collaborator+front_desk → 422, front_desk+sales_staff → 201) – SEC chốt thứ tự cố định; 139-03 Suggestion: thiếu ca ảnh CTV. Gộp #139 khi 139-01 xong, gộp main, build-test + E2E xanh ở SHA cuối. Shellcheck postgres-log-terse = OPS-11. ARC ghi chữ recordPayment (A) ở 0.3.14. Không ESC | ARC | rounds/round-05/reviews/ARC-on-be-prs-135-139.md |`
