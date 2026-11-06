# SEC – Review PR #139 (BE-B, 105-01) và #135 (BE-A2, 99D-01 + A2-04)

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:

| PR | Nhánh | SHA đã review | Thẻ SEC đóng | CI lúc đọc |
|---|---|---|---|---|
| #139 (DRAFT) | `r5-v5-48-proof-role` | **`97f03a65`** | FB-R5-SEC-BE-105-01 (Minor) | `format · lint · audit · test · build` đang chạy; `infra scripts (shellcheck)` đỏ (lượt chưa xong, chưa đọc được log bước); các job hợp đồng, OpenAPI, đường dẫn mật, gitleaks đã xanh |
| #135 (DRAFT) | `r5-a2-followup` | **`a6ab1900`** | FB-R5-SEC-BE-99D-01 (Suggestion) | `format · lint · audit · test · build` xanh (Vitest trên PostgreSQL thật: `v105-overdue-checkout.test.ts` 26/26). `shellcheck` đỏ ở bước `postgres-log-terse` (flake OPS-11 đã biết). `docker images build · E2E smoke` đỏ ở UI guest-web (mục 3.3) |

Cách kiểm:
- Diff ba chấm với `main` @ `74189d2c` (`git diff origin/main...<nhánh>`). Cả hai nhánh gộp vào `main` hiện tại không xung đột (`git merge-tree`).
- #135: trang PR trên GitHub còn liệt kê 21 tệp, vì so với mốc cũ. `main` nay đã chứa `92d16358` (gốc của nhánh), nên diff thật chỉ có **2 tệp**, đúng như mô tả PR: `audit-log.controller.ts` và `test/integration/v105-overdue-checkout.test.ts`.
- #139: đọc thêm đường ghi `attachment.uploaded_by_role` (`attachment.service.ts`, `attachments.controller.ts`, `auth.guard.ts`) và RLS của bảng `attachment` (migration 0078).
- #139: chạy file test `v5-48-closed-booking-money.test.ts` trên worktree tách riêng ở `97f03a65`, với một PostgreSQL tạm trên máy. Chỉ dùng dữ liệu fixture giả, xong thì xóa cả worktree lẫn container.
  - Kết quả: **11/11 xanh**.
  - Đột biến "tắt điều kiện `uploaded_by_role`" (thêm `AND false`, giữ tham số `$2`): **chỉ ca mới đỏ**. Ảnh sale bị thay trên tin báo được nhận 201. Bằng chứng khớp mô tả PR.
- #135: đọc `checkout.service.ts` (`overdueGate`, lượt đọc lại dưới khóa trong `checkOut`) và `unit-of-work.ts` (lỗi ném ra thì rollback cả khóa idempotency) trên nhánh. Không chạy lại trên máy, vì CI đã chạy file này trên DB thật ở đúng SHA.
- Không gọi staging hay production, không đẩy lên nhánh PR, không gộp.

Tệp này không có bí mật, mật khẩu, mã đơn, id hay dữ liệu khách.

---

## 0. Kết luận

| PR | SHA | Kết luận | Gộp khi |
|---|---|---|---|
| #139 | `97f03a65` | **DUYỆT** | `format · lint · audit · test · build` xanh trên đúng SHA. ORC xác nhận job `shellcheck` đỏ đúng ở bước `postgres-log-terse` (OPS-11) khi lượt chạy xong |
| #135 | `a6ab1900` | **DUYỆT** | Job test đã xanh. E2E smoke đỏ ở 2 ca UI guest-web, không nằm trong diff (mục 3.3). QA/ORC phân loại flake hoặc chạy lại sau khi gộp `main`. SEC không đặt thêm điều kiện bảo mật |

0 Blocker · 0 Major · 0 Minor · 2 Suggestion mới (139-01, 139-02). ESC mới: **không**.

| Thẻ | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-SEC-BE-105-01 (Minor) | **Done ở #139 @ `97f03a65`**. Đóng hẳn khi #139 gộp với CI xanh | Đủ 3 ca SEC đề xuất: ảnh bị thay → 422, ảnh chưa gửi → 422, ảnh FD+ → 201. Luật `deposit_notice` giữ nguyên. Kịp trước PR-B3 |
| FB-R5-SEC-BE-99D-01 (Suggestion) | **Done ở #135 @ `a6ab1900`**. Đóng hẳn khi #135 gộp | Có `Retry-After: 1`; 409 không ghi gì; gửi lại cùng khóa thì chạy lại (200, không `Idempotent-Replayed`); lần thứ ba mới là bản lưu. Đúng rủi ro thẻ nêu (mục 2.1) |

---

## 1. #139: ảnh do sale/CTV tải lên không làm chứng từ cho đơn đã đóng

### 1.1 Nguồn vai không giả mạo được từ máy khách: đạt
- Bảng `attachment` chỉ có **một** chỗ INSERT: `AttachmentService.upload`. Ở đó `uploaded_by_role` = `primaryRole(actor.roles, UPLOAD_ROLES[purpose])`.
- `actor.roles` lấy từ `principal.roles` do `AuthGuard` nạp: `user_property_role` của tài sản đang chọn, chưa thu hồi, cache ≤ 60 s theo `roles_version`.
- Body multipart chỉ đọc `purpose`, `reservationId`, `file`. Không có trường vai nào để máy khách gửi.
- Không có `UPDATE attachment SET uploaded_by_role`. Các UPDATE khác chỉ chạm `bound_ref_*`, `retention_anchor_at`, `purged_at`. Cột là `NOT NULL` (migration 0050).
- `SALES_ROLES` dùng lại hằng sẵn có (`['sales_staff', 'collaborator']`). Câu SQL tham số hóa (`$1`, `$2::text[]`), không nối chuỗi.

### 1.2 Lời từ chối không lộ gì về ảnh: đạt
- Ảnh bị từ chối trả đúng 422 `errors: [{ field: 'attachmentId', code: 'NOT_IN_LIST' }]`. Đây cũng là mã của `assertUsable` cho các trường hợp: không thấy ảnh, sai mục đích, ảnh của đơn khác, ảnh đã gắn. Máy khách không phân biệt được "ảnh của sale" với "ảnh không hợp lệ".
- Bảng `attachment` có `FORCE ROW LEVEL SECURITY`. Id ảnh của tài sản khác cho `EXISTS` = false, rồi `recordInTx` vẫn trả cùng 422. Không có kênh dò chéo tài sản.
- Không có `detail`, `extras` hay audit nào nêu người tải lên. Bị từ chối thì không ghi gì: snapshot khoản thu, QR chờ, audit tiền, version folio và ảnh đã gắn đều không đổi, test kiểm cho cả FD, FDL, MGR, OWN.
- Việc kiểm chạy sau 422 `method` và `attachmentId` REQUIRED, trong giao dịch có khóa đơn. Thứ tự lỗi giữ như #105.

### 1.3 Ảnh do quầy/chủ tải lên vẫn qua: đạt
- Ảnh FD tải lên → 201, `reconciliation: pending`.
- Với FDL, MGR, OWN: mã giống hệt (`primaryRole` trả vai FD+ của họ, không thuộc `SALES_ROLES`). Ca (h2) có sẵn trong file vẫn xanh cho cả 4 vai.
- Ảnh FD+ nằm ở một tin báo vẫn bị chặn như trước (nhánh `deposit_notice` của câu `OR`).

### 1.4 Còn lại (không chặn)
- Tài khoản kiêm nhiều vai: xem 139-01.
- Test chỉ dùng ảnh của sale. Chưa có ca ảnh CTV tải lên, dù `SALES_ROLES` phủ cả CTV: xem 139-02.

---

## 2. #135: 99D-01 (Retry-After, gửi lại cùng khóa) và A2-04 (`overdueOnly`)

### 2.1 Ca 99D-01: đạt, đóng thẻ
- **Giả khe tranh chấp.** Spy `CheckoutService.prototype.overdueStay`: lần gọi 1 (`overdueGate`, chưa khóa) chạy thật và thấy quá ngày đi; lần 2 (đọc lại dưới khóa) trả `null`. Như vậy là đi đúng nhánh `!!locked !== !!overdue` của `checkOut`. Test khẳng định `calls === 2`, nên đổi đường gọi là test đỏ ngay, không xanh nhầm. Spy được gỡ trong `finally`.
- **Lần gửi 1:** 409 `CONCURRENT_UPDATE` và `retry-after: '1'`. Snapshot đơn, folio, số dòng, số khoản thu không đổi. Không có audit `reservation.checked_out`.
- **Lần gửi 2** (cùng `Idempotency-Key`, cùng `If-Match`): 200, **không** có `Idempotent-Replayed`, đơn `checked_out`, đúng 1 audit quá hạn. Theo `unit-of-work.ts`, lỗi ném ra thì rollback cả dòng `idempotency_key`, nên khóa không giữ lại 409. Đường `{ fail }` (commit rồi mới báo lỗi) mới lưu lỗi. Nếu sau này ai chuyển 409 này sang `{ fail }`, lần gửi 2 sẽ phát lại 409 và test đỏ. Đây đúng là rủi ro thẻ 99D-01 nêu.
- **Lần gửi 3:** 200 + `Idempotent-Replayed: true`, audit vẫn 1, không ghi đôi.
- Giới hạn chấp nhận được: lần gửi 2 chạy trên trạng thái DB thật vốn không đổi (spy đã gỡ), chứ chưa có ca "gia hạn thật rồi gửi lại ra 422 `overdueReason` NOT_ALLOWED". Thẻ chỉ đòi chứng minh 409 không bị lưu, và ca này đã chứng minh. Không mở thẻ mới.

### 2.2 A2-04 `overdueOnly` qua `boolQuery`: đạt
- Rỗng → `false`, `true` → `true`. Giá trị khác, kể cả mảng khi gửi lặp tham số, → 422 `field: overdueOnly`, `code: VALIDATION_FAILED`. Mã giữ như cũ, ca 422 có sẵn vẫn xanh.
- `overdueOnly=` nay đọc là "không lọc", tức đúng kết quả của lần gọi không có tham số. Không nới phạm vi: quyền `listAuditEvents` và luật "FD/FDL chỉ thấy dòng của mình" nằm ở phần sau, không đổi. Ca mới so `overdueOnly=` (cả khi đi cùng `removalsOnly=` và `reductionsOnly=`) với lần gọi không tham số.

### 2.3 CI
- Job test ở `a6ab1900` xanh: 191 file, 4810 ca, `v105-overdue-checkout.test.ts` 26/26 trên PostgreSQL thật với vai `ottimo_app`.
- `shellcheck` đỏ ở bước `postgres-log-terse` (OPS-11).
- E2E smoke đỏ ở `v5-46-guest-id-number.r5.spec.ts` V5-46-2: `locator.click` hết 15 s, lần thử lại cũng hỏng. `guest-web.h18` TC-L7-053 cũng có một lần ✘.
- Diff #135 không chạm guest-web hay API guest. File Vitest integration không chạy trong E2E. QA/ORC phân loại (cùng họ "giới hạn mở trang khách" mà `1ed9ac0e` vừa xử lý cho H18/GW-01, hoặc lỗi riêng của V5-46-2).

---

## 3. Thẻ mới

### FB-R5-SEC-BE-139-01
- Mức độ: Suggestion
- Người nhận: BE-D (PR-B3), DOM biết. Không sửa trong #139.
- Vị trí:
  - `attachment.service.ts` `primaryRole(roles, allowed)` = vai **đầu tiên** của người gọi nằm trong `UPLOAD_ROLES`;
  - `auth.guard.ts` nạp vai `ORDER BY role` (thứ tự chữ cái);
  - `payments.service.ts` `recordAfterClosure` @ `97f03a65`.
- Vấn đề: với tài khoản kiêm nhiều vai, nhãn `uploaded_by_role` do thứ tự chữ cái quyết định, không theo vai người đó đang dùng. `users.controller` không cấm tổ hợp vai nào.
  - FD + sale → nhãn `front_desk`. Ảnh người này gửi kèm tin báo với tư cách sale, sau đó bị thay hoặc chưa từng gửi, vẫn được nhận làm chứng từ của đơn đã đóng.
  - CTV + FD → nhãn `collaborator`. Ảnh báo có ngân hàng người này tải lên ở quầy bị từ chối. Đây là hướng an toàn (chặn nhầm, không lọt).
- Vì sao quan trọng: rủi ro thấp. Người kiêm FD vốn được ghi tiền ở quầy, khoản thu luôn `pending` chờ đối soát sao kê, và chỉ OWN cấp tổ hợp vai. Ghi lại để PR-B3 (đưa nút lên Desk) và sổ tay không hiểu lầm rằng luật 105-01 phủ cả tài khoản kiêm vai.
- Đề xuất sửa (chọn một khi làm PR-B3):
  - (a) giữ mã, thêm một dòng vào sổ tay/threat model: "tài khoản kiêm sale + lễ tân: ảnh tải ở quầy được coi là ảnh quầy; chốt chặn là đối soát sao kê";
  - hoặc (b) DOM chốt "người từng giữ vai sale/CTV ở tài sản thì không tự tải chứng từ cho đơn đã đóng", rồi BE kiểm theo `uploaded_by` + `user_property_role` lúc tải.

  SEC nghiêng về (a).
- Trạng thái: Open

### FB-R5-SEC-BE-139-02
- Mức độ: Suggestion
- Người nhận: BE-D (cùng test của PR-B3) hoặc BE-B nếu còn sửa #139.
- Vị trí: `test/integration/v5-48-closed-booking-money.test.ts`, ca `FB-R5-SEC-BE-105-01`.
- Vấn đề: ca mới chỉ dùng ảnh do **sale** tải lên. `SALES_ROLES` có cả `collaborator`. Nếu sau này ai thu hẹp điều kiện còn `'sales_staff'`, sẽ không test nào đỏ. Fixture đã có client `ctv`.
- Vì sao quan trọng: DOM 11.4 2(c) áp cho cả ảnh CTV chuyển tiếp. CTV là nguồn ảnh "khách đã chuyển" thường gặp.
- Đề xuất sửa: thêm một ảnh `deposit_receipt` do CTV tải lên cho đơn CTV giữ chỗ, rồi hủy đơn. Kiểm FD ghi chuyển khoản với ảnh đó → 422 `attachmentId` `NOT_IN_LIST`, không ghi gì.
- Trạng thái: Open

---

## 4. Dòng đề xuất cho `decision-log.md`

```
| 2026-11-07 | 5 | SEC – DUYỆT #139 @ 97f03a65 (FB-R5-SEC-BE-105-01 Done: ảnh do sale/CTV tải lên – bị thay trên tin báo hay chưa gửi – không làm chứng từ đơn đã đóng, 422 attachmentId NOT_IN_LIST như mọi ảnh không hợp lệ, vai lấy từ user_property_role phía máy chủ; ảnh FD+ vẫn 201 pending; đột biến bỏ điều kiện vai làm ca mới đỏ) và #135 @ a6ab1900 (FB-R5-SEC-BE-99D-01 Done: 409 CONCURRENT_UPDATE có Retry-After: 1, không ghi gì, gửi lại cùng Idempotency-Key chạy lại không phát lại; overdueOnly qua boolQuery không nới phạm vi). Thẻ mới 139-01 (tài khoản kiêm vai), 139-02 (thiếu ca ảnh CTV) – Suggestion, cho PR-B3. Gộp khi CI xanh trên đúng SHA; không ESC | SEC | rounds/round-05/reviews/SEC-on-be-prs-135-139.md |
```

---

## 5. Điểm làm tốt
- #139 chặn theo **người tải lên** đúng như đề xuất. Luật cũ giữ lại thành một câu `EXISTS … OR EXISTS …` duy nhất, chạy trước `recordInTx`, và lời từ chối giống hệt mọi ảnh không hợp lệ khác.
- Cả hai PR có bằng chứng đột biến thật: SEC chạy lại cho #139 và thấy đúng ca mới đỏ. Ca của #135 tự khóa đường gọi bằng `calls === 2`, nên không xanh nhầm.
- Mô tả PR nói rõ phạm vi (2 tệp, không migration, không đổi hợp đồng) và khớp với diff thật.

---

## 6. Quyết định SEC cho ARC FB-R5-ARC-BE-139-02 (cùng vấn đề với SEC 139-01)

Bổ sung 07/11/2026, theo yêu cầu của ORC. Kết luận DUYỆT #139 @ `97f03a65` ở mục 0 không đổi.

**SEC chọn (a): dùng một thứ tự vai cố định, vai quầy đứng trước, cho mọi chỗ cần lấy "vai chính" của người dùng.** Nhãn `attachment.uploaded_by_role` sẽ lấy theo thứ tự giống `payment.recorded_by_role` và `actorRoleOf` của audit (owner → manager → front_desk_lead → front_desk → sales_staff → collaborator → …), lọc theo `UPLOAD_ROLES[purpose]`. Không lấy theo thứ tự mảng nữa.

Vì sao không chọn (b) hay (c):
- **(b) "có vai sale/CTV là từ chối"**: không đem lại thêm an toàn đáng kể.
  - Người kiêm quầy vốn được ghi tiền ở quầy, nên hệ thống không phân biệt được người đó tải ảnh "với tư cách" nào.
  - Chốt chặn thật là khoản thu luôn `pending` chờ đối soát sao kê.
  - Đổi lại, (b) ép nhân viên kiêm việc ở một nơi 10 căn phải nhờ người khác tải ảnh. Dễ dẫn tới dùng chung tài khoản, còn tệ hơn.
  - (b) cũng không làm được bằng nhãn một vai: phải đọc `user_property_role` lúc tải ảnh, mã đổi nhiều hơn.
- **(c) giữ nguyên**: không phải lỗ hổng, vì ca lệch nguy hiểm (FD + sale → 201) đã được đối soát che. Nhưng hai người cùng kiểu "quầy kiêm bán" bị xử ngược nhau chỉ vì thứ tự chữ cái. Đó là lỗi đúng/sai, không nên đem vào bản phát hành.

Điều kiện kèm (a):
- **Giữ vế `deposit_notice`** trong `recordAfterClosure`. Với (a), người quầy kiêm sale/CTV tải ảnh được nhãn vai quầy, nên vế này là thứ duy nhất chặn ảnh họ đã gửi kèm tin báo "khách đã chuyển". Nó không còn chỉ là lớp phòng thêm (ARC 139-03 N2).
- Chỉ áp cho ảnh tải mới, **không migration**. Ảnh cũ của người CTV + FD vẫn mang nhãn `collaborator` và bị từ chối, tức là chặn nhầm chứ không lọt.
- Test, đủ để diệt đột biến N2, N3 của ARC 139-03 và đóng SEC 139-02:
  - người CTV + FD tải ảnh báo có → 201 `pending`;
  - người FD + sale tải ảnh báo có → 201 `pending`;
  - người FD + sale gửi ảnh kèm tin báo rồi ghi chính ảnh đó → 422 `attachmentId` `NOT_IN_LIST`;
  - người chỉ có vai CTV tải ảnh cho đơn CTV giữ chỗ, đơn hủy, FD ghi bằng ảnh đó → 422 `attachmentId` `NOT_IN_LIST`.
- Một danh sách thứ tự dùng chung. `ROLE_ORDER` của `payments/public/payment.service.ts` hiện chưa export. ARC chọn chỗ đặt, miễn là `files` không giữ bản thứ tự riêng.
- Sổ tay/threat model thêm một câu: "Tài khoản kiêm quầy và sale/CTV: ảnh tải lên được tính là ảnh quầy, trừ ảnh đã gửi kèm tin báo; chốt chặn là đối soát sao kê."

**Thời điểm:** làm (a) **trong #139** nếu BE-B kịp trước tag v1.0.5. Việc này nhỏ: một hàm, 4 ca test, không đổi hợp đồng. Nếu không kịp, SEC **không chặn** gộp #139 hay tag. Khi đó v1.0.5 phát hành với hiện trạng kèm câu sổ tay ở trên, còn (a) vào v1.0.6 qua backlog. "Không kịp" chỉ lùi thời điểm, nghĩa của luật vẫn là (a).

Trạng thái thẻ:

| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-SEC-BE-139-01 (Suggestion) | Open → làm theo ARC 139-02 phương án (a) | Đóng khi nhãn vai theo thứ tự cố định đã gộp, kèm câu sổ tay |
| FB-R5-SEC-BE-139-02 (Suggestion) | Open | Đóng bằng ca "chỉ CTV → 422" trong bộ test trên |

Dòng đề xuất cho `decision-log.md`:

```
| 2026-11-07 | 5 | SEC chốt ARC FB-R5-ARC-BE-139-02 / SEC 139-01 theo phương án (a): attachment.uploaded_by_role lấy vai chính theo một thứ tự cố định, vai quầy trước (như payment.recorded_by_role / audit actorRoleOf), không theo thứ tự chữ cái; giữ vế deposit_notice (chặn ảnh người kiêm vai đã gửi kèm tin báo); chỉ áp ảnh tải mới, không migration; 4 ca test (CTV+FD → 201, FD+SAL → 201, FD+SAL ảnh tin báo → 422, chỉ CTV → 422). Làm trong #139 nếu kịp trước tag v1.0.5, không thì v1.0.6 + câu sổ tay; không chặn gộp; không ESC | SEC | rounds/round-05/reviews/SEC-on-be-prs-135-139.md |
```
