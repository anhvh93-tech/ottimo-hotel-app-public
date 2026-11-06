# ARC review PR #154 (BE-H) – `r5-h1c`: đổi người chốt theo hợp đồng 1h/1i, SEC 123-01, ARC 123-02

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR: [#154](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/154), nhánh `r5-h1c`, draft, `base = main`.
  - ARC đọc mã ở **`279b5492`**.
  - Trong lúc review, head chuyển sang **`4e81c3be`**. Commit này chỉ gộp `main` @ `c058c5f0` (có #149 `c2d5588d`, #151, #153). ARC tự kiểm:
    - hai cha là `279b5492` và `c058c5f0`;
    - `git show --remerge-diff` rỗng, tức git tự gộp, không sửa tay;
    - so với `279b5492`, trong `src` chỉ khác `rack.service.ts`, và phần khác đó là của #149.
  - Cây gộp thử của ARC (mục 5) = `4e81c3be` + #152, khác `4e81c3be` đúng hai tệp sinh của #152. **Kết luận dưới đây áp cho `4e81c3be`.**
- Quy mô (so với `main` @ `8598bb5a`): 12 tệp, +1310/−35. Có 8 tệp `src` và 4 tệp test. Không migration, không sửa `openapi.yaml` hay tệp sinh.
- Đối chiếu:
  - hợp đồng 0.3.13:
    - bổ sung 1h (#147 @ `35e88ffd`): bảng 1.29;
    - bổ sung 1i (#152 @ `ca276f8a`, ARC viết): bảng 1.30, mô tả `updateReservation`, `ReservationPatch.closerChangeReason`, mục 0.3.14 (e);
  - review cũ: `ARC-on-be-h-prs-110-123-131.md` (mục 4.2, 4.3; thẻ 131-02, 131-03, 123-02), `ARC-on-be-h-pr-149.md` (thẻ 149-01);
  - `DOM-on-contract-addendum-1h.md` (mục 1.3–1.5, thẻ 1H-04), `SEC-on-contract-0313-addenda-1g-1h.md` (mục 2.2–2.5, thẻ 1H-01, 1H-03);
  - `DOM-on-be-h-pr-154.md` (đã lên `main` ở `31e12c48`). ARC đọc sau khi tự kiểm xong, nên không lặp thẻ DOM; mục 8 trả lời hai thẻ DOM gửi ARC.
- Cách kiểm:
  - Đọc mã trên ref riêng (`refs/scratch/pr154`, `pr154b`, `pr152`, `pr147`, `pr149`), trong ba worktree tạm ở scratchpad. Không checkout nhánh trong thư mục chính, không push vào nhánh PR.
  - PostgreSQL 17 riêng: container `arc-154-pg`, chỉ nghe `127.0.0.1`, mật khẩu là mật khẩu CI công khai của repo. Một database cho lần chạy đủ, một database riêng cho đột biến.
  - Container, worktree và các ref tạm đã xóa sau review.
  - Không gọi staging hay production. Tệp này không có bí mật, IP máy chủ, tỷ lệ hay số tiền hoa hồng, dữ liệu khách. Mọi ví dụ dùng `test_rate_short`.
- CI của `4e81c3be` lúc viết: 5 job xanh (confidential paths, no test endpoints, Redocly, contract RBAC `--strict`, gitleaks). Các job còn lại đang chạy: test/build, landing, shellcheck. E2E smoke chưa bắt đầu. Trên `279b5492` có 8/9 job xanh; E2E smoke chưa xong khi head đổi.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Điều kiện gộp | Thẻ ARC |
|---|---|---|---|
| **#154 @ `4e81c3be`** (đọc mã ở `279b5492`) | **DUYỆT CÓ ĐIỀU KIỆN** | (1) Thứ tự gộp **#147 → #152 → #154**. #149 đã gộp. (2) CI xanh trên head cuối, **kể cả E2E smoke** | 154-01 (Minor) |

- Mã khớp chữ hợp đồng 1h/1i ở mọi điểm ARC đối chiếu (mục 1). Có hai chữ 1i BE-H đã xin, cả hai đúng: lý do ở **cột `reason`** của audit; mã `CLOSER_CHANGE_BEFORE_CHECKIN`.
- Không migration. Thứ tự khóa giống B18: đơn → (căn) → folio → `commission`. Không đổi tương tác với idempotency của #123 (mục 2–4).
- Gộp thử hai lần, git tự gộp cả hai, không xung đột, `tsc --noEmit` sạch:
  - lần 1, `main` @ `960ff5f2` + #149 + #152 + #154: toàn bộ API **217 tệp qua, 2 tự bỏ qua; 5170 ca qua, 19 bỏ qua, 1 todo, 0 hỏng**;
  - lần 2, `main` @ `506c20c4` (đã có #149, #151, #153) + #152 + #154, tức `4e81c3be` + #152: **218 tệp qua, 2 tự bỏ qua, 0 hỏng** (chi tiết ở mục 5).
- Đột biến của ARC: 9 đột biến. 6 đỏ ngay. 3 còn xanh (R1, R2, R4), dù mã hiện tại đúng ở cả ba chỗ (mục 6.2).
  - R1 khớp thẻ DOM 154-02. Thẻ ARC 154-01 gom hai đột biến còn lại, cộng một thứ tự lỗi chưa có ca kiểm.
  - ARC đã viết thử 5 ca (P1–P5, mục 6.2). Cả 5 xanh trên mã hiện tại. P2, P3, P4 làm đỏ đúng R2, R1, R4.
  - Đây là thiếu test, không phải lỗi mã, nên không chặn gộp. ARC đề nghị BE-H thêm các ca này ở head kế tiếp; muộn nhất trước PR-M.
- ARC 123-02, ARC 131-03, ARC #114 12.3 (D1): **đóng** khi #154 gộp. SEC 123-01, SEC 1H-01, 1H-03 ý 1: phần mã khớp lời ARC; SEC tự đóng thẻ của SEC.
- Thẻ ARC 131-02 (Major): **đóng** khi #154 gộp, cùng DOM 131-01.

---

## 1. Mã so với chữ hợp đồng 1h/1i

| Điểm hợp đồng (`updateReservation`, 1.29, 1.30) | Mã @ `279b5492` | Kết quả |
|---|---|---|
| "Đổi" = khác giá trị đang lưu, kể cả ghi lần đầu | `closerChange = closerUserId !== undefined && closerUserId !== row.closer_user_id` (`reservations.service.ts:1378`). `null` trong thân → `undefined` (`Fields.uuid`), nên không có "đổi" giả | Khớp |
| Kiểm quyền sau khi tải đơn, dưới khóa đơn | `loadReservation(…, { forUpdate: true })` rồi mới kiểm quyền (1446) | Khớp |
| `hold`: FD+ như cũ | Nhánh quyền bỏ qua khi `row.status === 'hold'` | Khớp |
| Chưa nhận phòng: MGR+; FD/FDL → 403 + **một** `access.denied` `CLOSER_CHANGE_BEFORE_CHECKIN` (1i, SEC 1H-03) | `auditReason: CLOSER_CHANGE_BEFORE_CHECKIN`; controller gọi `recordUseCaseDenial` sau rollback với cả hai mã (`reservations.controller.ts:265`) | Khớp, đúng chữ mã 1i |
| Sau nhận phòng (`in_house`, `checked_out`): chỉ OWN; vai khác → 403 + một `access.denied` `CLOSER_CHANGE_AFTER_CHECKIN` | `checkedIn = actual_checkin_at !== null \|\| status ∈ {in_house, checked_out}`. B17 xóa `actual_checkin_at`, nên vế đầu chỉ là lớp phòng thủ | Khớp |
| `access.denied` không chứa chữ người gọi gõ | Ghi `after = { operationId, roles }`, như guard | Khớp; test đọc lại |
| Thứ tự 403 → 422 (`closerUserId`, `closerChangeReason`) → 409 | `closerKind` và lý do chỉ `f.add`. Lần `f.done()` thứ hai chạy sau 403. 409 `payable`/`paid` nằm trong `syncCommissionOnly`, chạy sau `f.done()` | Khớp. Lỗi **dạng** của thân (kiểu, biên, uuid sai dạng) vẫn ra 422 trước khi tải đơn. Lỗi này không phụ thuộc trạng thái đơn, nên không lộ gì. ARC ghi rõ câu này ở 0.3.14 (mục 9) |
| `closerChangeReason` 3–500, V-08/V-09; bắt buộc khi OWN sửa sau nhận phòng; tùy chọn trước đó; gửi mà không đổi → 422 `NOT_ALLOWED` | `f.text(…, 500, { required: checkedIn && status ≠ hold, min: 3 })`: `stripControlChars`, `containsCardNumber`. `REASON_REQUIRED` / `TOO_LONG` / `CARD_NUMBER_DETECTED`. Không đổi mà có lý do → `NOT_ALLOWED` | Khớp |
| Đơn `checked_out`: chỉ nhận `closerUserId` (+ lý do); trường khác → 409 `INVALID_TRANSITION` (`currentState = checked_out`) – 1i, BE 1H-01 | `closerOnly` xét **mọi khóa** của thân, kiểm ngay sau `assertVersion`, trước mọi lệnh ghi | Khớp. Chặt hơn chữ hợp đồng một chút: khóa lạ hoặc khóa có giá trị `null` cũng ra 409. ARC chấp nhận |
| Hoa hồng đồng bộ trong cùng giao dịch: người cũ `void` (`closer_changed` / `closer_corrected`), người mới theo tỷ lệ ghim | `MoneyBridge.closerChanged` → `FolioStaySync.syncCommissionOnly`. `syncCommission` nhận `voidReason`. Tỷ lệ lấy theo `pinnedCommissionRate`: ảnh chụp → bản ghi đầu cùng loại người hưởng | Khớp. Tên `syncCommissionOnly` thay cho `syncCommission` của ARC 4.2: ARC đồng ý, vì 1h không nêu tên |
| Người mới theo **luật đạt của B18**; `recognized_at` = lúc sửa (1i, BE 1H-02) | Đơn `checked_out` → `tryEarnCommissions` (luật đầy đủ, kể cả 1H-04), ghi `clock.now()` của lần sửa | Mã đúng: probe P3 ra đúng giờ sửa. Test chưa ghim giờ (DOM 154-02, đột biến R1) |
| Có `payable`/`paid` → 409 `INVALID_TRANSITION` (`currentState`), không ghi gì | Kiểm đầu `syncCommissionOnly`; lỗi ném ra thì cả giao dịch rollback | Khớp |
| Audit `reservation.closer_changed`: `before`/`after.closerUserId`; allowlist thêm `closerUserId`; lý do ở **cột `reason`**, không ở `after`, không thêm `reason` vào allowlist (1i, SEC 1H-01) | `audit-entities.ts` thêm đúng `closerUserId`; `recordMoney({ …, reason: closerReason })` | Khớp, đúng chữ "cột `reason`" của 1i |
| Không trả lại lý do ở `Reservation` | Không có trong DTO | Khớp |
| Không migration (`void_reason` là `text`) | Không tệp migration. `commission_void_check` chỉ đòi `void_reason` khác rỗng khi `void` | Khớp |
| 0.3.14 (e): thân lồng quá 32 tầng → 422 `VALIDATION_FAILED` ở `request-hash.ts` cho mọi nơi gọi; guard lỗi hash → không phát lại, 403 + `access.denied`, không 5xx | `MAX_BODY_DEPTH = 32`; `bodyTooDeep` dùng ngăn xếp, không đệ quy, kiểm **trước** `withoutSecrets`/`canonicalJson`. Guard `try/catch` → `false` (`auth.guard.ts:403`) | Khớp. ARC tự đo trên `openapi.yaml`: thân lồng sâu nhất là 5 tầng (`createReservationGroup`), đúng như BE-H ghi |

---

## 2. Migration

Không có. Hai lý do `void` mới nằm trong cột `text`. Không ràng buộc nào liệt kê giá trị cột này. `Commission.voidReason` ở `openapi.yaml` là `string` tự do, `listCommissions` không trả cột này. Mục 4 của `contract-0.3.13.md` (QC R4 ĐK-2) không bị chạm.

## 3. Giao dịch và thứ tự khóa

- `update()`:
  - L1: đơn `FOR UPDATE`;
  - (`repriced`) căn `lockRooms`;
  - ghi `reservation`, `reservation_change`, audit;
  - `closerChanged`: folio `lock` (L3) → `commission` `earned/payable/paid` `FOR UPDATE` → (`syncCommission`) `commission` `projected` `FOR UPDATE` → `stay_night.setCommissions` → (đơn `checked_out`) `tryEarnCommissions`;
  - (`repriced`) `resynced` (L3 đã giữ).
- Cùng thứ tự B18 (L1 → L3 → `commission`) và cùng thứ tự "đơn → căn → folio" của `MoneyBridge.lockFolio`. Không đảo khóa.
- Các đường khác chạm `commission` của cùng đơn đều giữ L1 trước:
  - đối soát và xác nhận tiền mặt: `lockPayment` → `lockForDeposit` (L1) → L3;
  - `lockStay`: L1 `FOR NO KEY UPDATE` → L3;
  - `reversePayment`: L1 → L3.
  Vì vậy hai lần `FOR UPDATE` trên `commission` (khác tập dòng, khác `ORDER BY`) không thể khóa chéo nhau.
- `lockFolio` trong `closerChanged` vì vậy không bắt buộc cho đúng đắn hôm nay, nhưng ARC giữ nó: bước "đạt" đọc số dư, và B18 cũng khóa folio. Không có test đồng thời cho đường này. ARC không đòi, vì L1 đã tuần tự hóa.
- Mọi lỗi (403, 409, 422 lượt hai) đều ném trong UnitOfWork. Các lệnh ghi phía trước vì vậy rollback hết, kể cả `roomReturnRecorded`, `roomDisclosedToGuest`, `doorAccessHandedOver` nếu có trong cùng thân. `access.denied` ghi sau rollback, giao dịch riêng (mẫu #110).
- **Sửa gộp (người chốt + số khách, đơn đang ở):** `closerChanged` chạy **trước** `resynced`, nên dòng của người cũ `void` với `closer_corrected`/`closer_changed`, không với `resync`. Probe P2 xác nhận. Đây là lựa chọn đúng, vì DATA đếm riêng `closer_corrected` (DOM 1h mục 1.2). Chưa có test giữ thứ tự này (thẻ 154-01).

## 4. Tương tác với #123 (idempotency)

- `updateReservation` không khai `Idempotency-Key` (`openapi-meta.ts`: `idempotencyKey: false`, `ifMatch: true`).
  - Gửi lại sau khi thành công → 412 (version đã đổi). Không đồng bộ hoa hồng lần hai.
  - Guard của #123 không hoãn quyết định vai cho thao tác này. 403 của đổi người chốt luôn đi qua `recordUseCaseDenial`, đúng một dòng mỗi request.
- `requestHash` chỉ chạy ở nơi có `Idempotency-Key`: UnitOfWork, guard, đơn vị công việc của khách, đặt phòng công khai. Đúng chữ 0.3.14 (e).
- Các thân khác chỉ được đọc từng trường, không đệ quy. Probe P5: PATCH đơn với `internalNote` lồng 10.000 tầng → **422** (`internalNote` `VALIDATION_FAILED`), không 500, không `access.denied`.
- Ca tích hợp 10.000 tầng kèm `Idempotency-Key` ở `write-roles-gate` phủ đường guard → 403, và đường UnitOfWork → 422.
- ARC 123-02: `guardWithStored` chỉ trả dòng khi câu SQL có `method = $3`, `path = $4`, `request_hash = $5` **và** `$5` đúng là hash của thân đã lưu. Ca "khớp" (đổi thứ tự khóa, có query string) cũng có. Đột biến A1 của BE-H (bỏ lọc hash) đỏ. **Đóng 123-02.**

## 5. Gộp thử và tương tác với #149

- #149 đã gộp (`c2d5588d`), nên điều kiện "#154 sau #149" của SEC đã đạt.
- Các bản ghi `#154` ghi thêm đều qua cổng của #149:
  - `commission.voided`, `commission.projected`, `commission.earned` ghi `entityType: 'commission'`, nên FD/FDL không thấy ở `listAuditEvents` hay `getReservationHistory`;
  - `reservation.closer_changed` không thuộc loại hạn chế. FD/FDL vẫn thấy `closerUserId` và cột `reason` (lớp D12c, SEC đã nhận ở 2.3).
- #154 không thêm câu `FROM audit_event` nào trong `src`, nên test quét của #149 không đổi.
- Gộp thử, cả hai lần không xung đột, `tsc` sạch:
  - Lần 1: `main` @ `960ff5f2` + #149 + #152 + #154 @ `279b5492`. Kết quả: 217 tệp qua, 2 tự bỏ qua; 5170 ca qua, 19 bỏ qua, 1 todo, 0 hỏng.
  - Lần 2: `main` @ `506c20c4` (đã có #149, #151, #153) + #152 + #154, tức `4e81c3be` + #152.
    - Chạy đủ: 217 tệp qua, 2 tự bỏ qua, 5168 ca qua.
    - Có 1 tệp đỏ: `production-bootstrap.test.ts` báo "BOOTSTRAP_DATABASE_URL must be a freshly created database". Lỗi do môi trường: database bootstrap đã dùng ở lần 1, mà test này đòi database mới tạo.
    - ARC tạo lại database đó rồi chạy riêng tệp này: 11/11 ca qua. Vậy lần 2 là 218 tệp qua, 0 hỏng.
- **#154 không phụ thuộc #147/#152 lúc chạy.** Bộ đọc thân không bỏ khóa lạ, và `openapi-schemas.ts` chỉ dùng cho phản hồi. Tuy vậy, thứ tự gộp vẫn phải là hợp đồng trước:
  - SEC điều kiện (1): chữ 1H-01 và BE 1H-01 phải có trong hợp đồng trước khi gộp `r5-h1c`;
  - FE-A sinh kiểu `closerChangeReason` từ #147.

## 6. Test

### 6.1 Test của PR

- `v5-30-closer-change.test.ts` (18 ca) phủ:
  - đủ 5 ca DOM 131-01 mục 3, hai ca thêm của ARC 4.2, ARC 131-03 (đơn W), ARC #114 12.3 (đơn E, D1);
  - 409 khi `payable`, 5 thân 409 trên đơn `checked_out`;
  - SEC 1H-01 (đọc lại `audit_event`, allowlist), DOM 1H-04 K1/K2, lưới an toàn và ca legacy.
- Ca nào cũng đọc lại DB: hoa hồng, người chốt, `version`, số dòng folio, audit. Không chỉ kiểm mã HTTP. Ca hoa hồng dùng `test_rate_short` và `applyPct`, không viết thẳng số (G3).
- `request-hash-guard-units.test.ts`: biên 31/32/33 tầng, mảng tính là một tầng, `Buffer` không tính, thân rộng, 20.000 tầng không `RangeError`, guard không ném kể cả khi getter ném.
- `v5-16-br438-checkout.test.ts` (DOM 110-03): A32 trước BR-438 trên folio `settled`, không thêm `access.denied` BR-438, folio không đổi.
- BE-H báo 30 đột biến đỏ. ARC chạy lại 2 đột biến của bảng đó, trên cây gộp thử:
  - S1 (bỏ giới hạn độ sâu): đỏ 3 ca;
  - A1 (guard không lọc theo hash): đỏ 4 ca, gồm ca ARC 123-02 mới và 2 ca tích hợp P1 của #123.

  ARC đọc đủ 30 đột biến; tên ca bắt được đúng như BE-H ghi.

### 6.2 Đột biến của ARC

Mỗi lần sửa một chỗ trên cây gộp thử lần 1 (mã `src` của `reservations`, `folio`, `shared/http` giống hệt `4e81c3be`), chạy lại các tệp test liên quan, rồi trả mã về. R1, R2, R8, R9 chạy 3 tệp V5-30. R4, R5 chạy 9 tệp có hoa hồng. R6, R7 chạy `request-hash-guard-units` và `write-roles-gate`.

| # | Đột biến | Kết quả |
|---|---|---|
| R1 | Đơn `checked_out`: dòng `earned` của người mới lấy ngày B18 (`folio.settled_at`) thay vì lúc sửa | **Xanh** – ca X chỉ kiểm `recognized_at` khác rỗng (= DOM 154-02) |
| R2 | `closerChanged` chạy **sau** `resynced` (sửa gộp người chốt + số khách) | **Xanh** – không ca nào sửa gộp; dòng người cũ thành `void` `resync` (thẻ 154-01) |
| R4 | 1H-04: tập "người hưởng" bỏ điều kiện `v.reservation_id = c.reservation_id`, tức mọi người hưởng của cơ sở | **Xanh** – 156/156 ca qua; khoản chờ của một sale chỉ là người hưởng ở đơn **khác** cũng giữ hoa hồng (thẻ 154-01) |
| R5 | 1H-04: chỉ người hưởng có bản ghi `void` | Đỏ 3 ca (`payments-s3`, `v105-commission-anchor`, K1/K2) |
| R6 | Độ sâu `>=` thay `>` (giới hạn thật 31) | Đỏ 2 ca |
| R7 | `canonicalJson(withoutSecrets(body))` chạy trước kiểm độ sâu | Đỏ 2 ca (đơn vị 20.000 tầng; tích hợp 10.000 tầng) |
| R8 | Bỏ `closerUserId` khỏi allowlist `reservation` | Đỏ 4 ca |
| R9 | Lưới an toàn `ensureCommission` dùng `resync` thay `closer_changed` | Đỏ 1 ca |
| R10 | `checkedIn` bỏ vế `actual_checkin_at !== null` | Không chạy: tương đương, vì B17 xóa `actual_checkin_at` (`checkin.service.ts:1175`) |

Probe: ARC thêm tạm 5 ca vào bản sao của tệp test, chỉ trong scratchpad, không commit.
- Trên mã hiện tại cả 5 ca xanh: 23/23 ca của tệp.
- P2, P3, P4 làm đỏ đúng đột biến của mình. P1, P5 giữ một luật chưa có ca nào:

| Probe | Nội dung | Bắt đột biến |
|---|---|---|
| P1 | Đơn có hoa hồng `payable`, MGR đổi người chốt → 403 + đúng một `access.denied`, không phải 409 | (thứ tự 403 → 409 của 1i; chưa có ca nào) |
| P2 | OWN sửa gộp người chốt + `adults` ở đơn đang ở → dòng người cũ `void` `closer_corrected`, chỉ còn dòng sống của người mới | R2 |
| P3 | Đơn X: dòng `earned` của người mới có `recognized_at` đúng giờ OWN sửa | R1 |
| P4 | Sale khác ghi một khoản cọc tiền mặt còn chờ trên folio, sale đó chỉ là người hưởng ở đơn khác → B18 vẫn `earned` cho người chốt của đơn | R4 |
| P5 | PATCH không `Idempotency-Key`, thân lồng 10.000 tầng → 422, không 500 | (mục 4) |

---

## 7. Thẻ feedback ARC

### FB-R5-ARC-BE-154-01
- Mức độ: **Minor** (mã đúng; thiếu ca giữ ba luật. Không chặn gộp. Nên có ở head kế tiếp của `r5-h1c`, muộn nhất trước PR-M)
- Người sửa: BE-H (hoặc QA, nếu ORC giao)
- Vị trí: `product/services/api/test/integration/v5-30-closer-change.test.ts`; mã liên quan:
  - `reservations.service.ts:1676` (thứ tự `closerChanged` → `resynced`);
  - `folio.service.ts:1597` (tập người hưởng của 1H-04);
  - nhánh 409 `payable`/`paid` ở `syncCommissionOnly`.
- Vấn đề: ba luật mà mã đang làm đúng chưa có ca giữ. Đột biến R2 và R4 xanh (mục 6.2).
  - (a) **Sửa gộp** (người chốt + trường đổi giá) trên đơn đang ở hoặc đã xác nhận. Nếu sau này ai chuyển `closerChanged` xuống sau `resynced`, dòng của người cũ thành `void` `resync` thay vì `closer_corrected`/`closer_changed`. Test không đỏ.
  - (b) **Phạm vi 1H-04.** Tập "người hưởng" phải là người hưởng **của chính đơn**. Bỏ điều kiện đơn thì mọi khoản chờ do một sale/CTV bất kỳ ghi trên folio cũng giữ hoa hồng. Ví dụ: sale thu cọc hộ đồng nghiệp. Cả 156 ca vẫn xanh.
  - (c) **403 trước 409** (1i, SEC 1H-03 ý 2). Mã đúng về cấu trúc: kiểm quyền nằm trong `update()`, còn 409 nằm trong `syncCommissionOnly`. Nhưng chưa ca nào cho vai bị từ chối gọi trên đơn có hoa hồng `payable`. Thứ tự này giữ cho FD không biết hoa hồng của người khác đã vào kỳ chi.
- Vì sao quan trọng:
  - (a) DATA đếm riêng `closer_corrected` (DOM 1h mục 1.2);
  - (b) hoa hồng đúng người mà bị treo `projected` tới khi đối soát một khoản không liên quan; màn **Hoa hồng** ghi "dự kiến", chủ đầu tư chi muộn;
  - (c) là điều kiện bảo mật SEC đã ghi vào hợp đồng.
- Đề xuất sửa: thêm ba ca, theo đúng P1, P2, P4 ARC đã thử (mục 6.2). Cả ba xanh trên mã hiện tại:
  1. (P2) OWN, đơn đang ở, thân `{ closerUserId, closerChangeReason, adults }` → dòng người cũ `void` `closer_corrected`, đúng một dòng sống của người mới. Nên thêm một ca MGR trước nhận phòng → `closer_changed`.
  2. (P4) Đơn người chốt A; sale B, người hưởng ở đơn khác, ghi một khoản cọc tiền mặt còn chờ trên folio này → B18 → A `earned`.
  3. (P1) Sau khi đặt `payable` (ca Y), MGR đổi người chốt → 403 + đúng một `access.denied`, không 409.
  Thêm R2, R4 vào bảng đột biến của PR; cả hai phải đỏ. Làm cùng DOM 154-02 (R1 = P3).
- Trạng thái: Open

---

## 8. ARC trả lời các thẻ DOM gửi ARC (`DOM-on-be-h-pr-154.md`)

| Thẻ DOM | ARC |
|---|---|
| FB-R5-DOM-BE-154-01 (Suggestion: dòng `earned` của người cũ giữ `recognized_at` khi `void`) | **ARC chốt: giữ ngày.** BE-H bỏ `recognized_at = NULL` ở lệnh `void` của `syncCommissionOnly` (`folio.service.ts:1785`), và sửa ca X để kiểm dòng `void` giữ đúng giờ B18. Lý do: (1) cùng cách `voidCommissions` (B10/B11) đang làm; (2) không nơi nào đọc cột này mà không lọc trạng thái: chỉ `commissions.service.ts` (hiển thị) và `folio.service.ts` (ghi) đọc, ARC đã tìm trong `src`; (3) không ràng buộc DB nào đòi rỗng; (4) chủ đầu tư cần ngày đó để trừ ở kỳ sau (BR-212). `unearnCommissions` vẫn xóa ngày, đúng, vì dòng quay về `projected` và sẽ đạt lại với ngày mới. Một token mã, không migration. Làm cùng head kế tiếp; ARC đọc lại phần chênh. Không cần câu 0.3.14 |
| FB-R5-DOM-BE-154-02 (Minor: ghim `recognized_at` = lúc sửa) | Đồng ý. Đột biến R1 của ARC xanh, đúng như DOM nói. Probe P3 làm nó đỏ. Không lặp thẻ |
| FB-R5-DOM-BE-154-03 (Minor: Desk theo mốc, FD/FDL chỉ đọc) | Đồng ý. ARC thêm một câu ở gạch FE-A của 0.3.14 (mục 9) |
| FB-R5-DOM-BE-154-05 (Suggestion v1.0.6: người chốt cũ chưa có bản ghi, đọc `reservation_change`) | Đồng ý hướng và hạn v1.0.6. Khi làm, giữ điều kiện "của chính đơn" mà thẻ 154-01 (b) đòi test |

## 9. Việc của ARC sau review này

Ghi ở danh sách 0.3.14 (mục 1.26 của `contract-0.3.13.md`), PR tài liệu kế tiếp. Chỉ mô tả, không đổi schema:
1. `updateReservation`: "Thứ tự 403 → 422 → 409 áp cho các kiểm sau khi tải đơn. Lỗi dạng của thân (kiểu, biên, uuid sai dạng) trả 422 trước khi tải đơn và không phụ thuộc trạng thái đơn."
2. Gạch FE-A: "FD/FDL thấy người chốt ở dạng chỉ đọc khi đơn ngoài `hold`; ô sửa theo mốc của bảng 1.29" (DOM 154-03).
3. `erd.md` 4.x `commission.void_reason`: liệt kê các giá trị đang ghi: `resync`, `closer_changed`, `closer_corrected` và các lý do của B10/B11. Ghi rõ dòng `void` giữ `recognized_at` (DOM 154-01).

## 10. Ghi chú cho ORC

- **Thứ tự gộp:** #147 → #152 → #154. Gộp bằng merge commit, như các PR trước của BE-H (lịch sử nhánh toàn merge, không rebase).
- **FB-R5-ARC-BE-149-01** (Minor, test quét `audit_event` của #149) đã ghi là "làm ở `r5-h1c`". Lúc #154 mở, #149 chưa lên `main`, nên #154 chưa làm được. Nay `r5-h1c` đã có #149:
  - BE-H làm ở head kế tiếp, cùng 154-01 và DOM 154-01/02; hoặc
  - tách một PR nhỏ, gộp trước tag v1.0.5.
  ARC nghiêng về cách thứ nhất (cùng tác giả, cùng lần đọc phần chênh).
- **Plan 4a T19** vẫn ghi "OPS chạy truy vấn trước khi cắt". Bổ sung 1i (1.30, DOM 1H-01) đã đổi thành chạy **ngay sau khi `r5-h1c` lên** máy chủ, gồm hai danh sách, đọc từ `reservation_change`. PO sửa dòng T19 cho khớp. OPS thêm bước vào runbook bản có `r5-h1c`.
- Tài nguyên tạm của ARC đã xóa: container `arc-154-pg`, worktree `wt154`, `wt-trial`, `wt-mut`, các ref `refs/scratch/pr147`, `pr149`, `pr152`, `pr154`, `pr154b`.

## 11. Điểm làm tốt

- Mỗi luật của 1h/1i có đúng một chỗ trong mã, đặt ở đúng mốc kiểm: quyền dưới khóa đơn; 409 ở phía `folio`, nơi biết trạng thái hoa hồng. Thứ tự 403 → 422 → 409 vì vậy đúng tự nhiên, không cần đoán.
- `bodyTooDeep` dùng ngăn xếp, chặn trước mọi hàm đệ quy. Guard không bao giờ ném. Số 32 có đối chiếu với schema thật. ARC đo lại, ra cùng số tầng.
- Test đọc lại DB sau từng lần từ chối: người chốt, `version`, hoa hồng, folio, audit. Ca legacy và lưới an toàn chứng minh "chạy lại không thêm dòng thứ hai". BE-H tự nêu giới hạn của 1H-04 thay vì im lặng.

## 12. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC DUYỆT CÓ ĐIỀU KIỆN BE-H #154 (`r5-h1c`) @ `4e81c3be` (đọc mã ở `279b5492`; `4e81c3be` chỉ gộp `main` @ `c058c5f0`, remerge-diff rỗng). Điều kiện gộp: thứ tự #147 → #152 → #154 (#149 đã gộp); CI xanh trên head cuối, kể cả E2E smoke. Mã khớp hợp đồng 1h/1i: quyền theo mốc dưới khóa đơn, FD/FDL trước nhận phòng và vai khác OWN sau nhận phòng → 403 + một `access.denied` (`CLOSER_CHANGE_BEFORE_CHECKIN`/`AFTER_CHECKIN`); thứ tự 403 → 422 → 409; `checked_out` chỉ nhận người chốt + lý do; người mới đạt theo luật B18, `recognized_at` = lúc sửa; lý do ở cột `reason` của audit, allowlist chỉ thêm `closerUserId`; `MAX_BODY_DEPTH` 32 (schema sâu nhất 5) và guard try/catch. Không migration; khóa đơn → căn → folio → `commission` như B18; `updateReservation` không có `Idempotency-Key`, nên không đổi tương tác #123. Gộp thử trên PostgreSQL 17, `tsc` sạch cả hai lần: `main` @ `960ff5f2` + #149 + #152 + #154 → API 217 tệp / 5170 ca xanh; `main` @ `506c20c4` + #152 + #154 (= `4e81c3be` + #152) → 218 tệp xanh (`production-bootstrap` chạy lại trên database bootstrap mới tạo). 9 đột biến ARC: 6 đỏ, 3 xanh (R1 = DOM 154-02, R2, R4) dù mã đúng → thẻ 154-01 Minor (test sửa gộp, phạm vi 1H-04, 403 trước 409; trước PR-M). ARC chốt DOM 154-01: dòng `void` giữ `recognized_at` (như `voidCommissions`). Đóng ARC 131-02, 131-03, 123-02, #114 12.3 khi gộp. 149-01 làm ở head kế tiếp. Không ESC | ARC | rounds/round-05/reviews/ARC-on-be-h-pr-154.md |
