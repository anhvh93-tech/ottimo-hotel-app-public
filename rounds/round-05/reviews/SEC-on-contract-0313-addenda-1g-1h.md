# SEC – Review hợp đồng 0.3.13 bổ sung 1g (PR #132) và bổ sung 1h (PR #147)

Round 5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Gốc (merge-base với `main`) | Phần của PR | CI lúc đọc |
|---|---|---|---|---|---|
| #132 (1g) | `r5-contract-docs-1g` | **`c249deb0`** | `7a141dbf` | 4 tệp: `openapi.yaml`, api-client sinh lại, `contract-0.3.13.md` (1.26, 1.28, mục 2, bảng 1.3, 1.25), `ARC-on-contract-0.3.13-reviews.md` mục 9 | 9/9 job xanh (gồm E2E smoke, `RBAC --strict`, gitleaks, confidential paths) |
| #147 (1h) | `r5-contract-1h` | **`0943db43`** | `e039c62a` | Commit riêng **`b5fe802f`** (7 tệp: `openapi.yaml`, `architecture.md` 5.1, `traceability.md`, api-client và `openapi-schemas.ts` sinh lại, `contract-0.3.13.md` 1.26 + 1.29, tệp phản hồi mục 10). Còn lại là hai lần gộp `main` | 9/9 job xanh |

Xếp chồng: #147 chứa `c249deb0` (đầu #132) và `b745289e` (gộp `main` @ `6d5e02ec` vào nhánh 1g; commit này chưa có trên #132). `git show --remerge-diff` của `b745289e` và `0943db43` rỗng: hai lần gộp không sửa tay chỗ nào.

Đối chiếu:
- `SEC-on-prs-111-118-122.md` mục 1.3 (FB-R5-SEC-ARC-23, ARC-24);
- `SEC-on-be-h-prs-110-131.md` mục 2.3–2.5 và mục 4 (FB-R5-SEC-BE-131-01, 123-01);
- `SEC-responses.md` mục 4, 5; `SEC-on-be-pr-120-v5-58.md` (cửa sổ ngày UTC); `SEC-on-prs-105-119-125-128.md` (C0313-29 (b));
- `security-requirements.md`: SR-PAY-10 (bản 07/11), SR-RL-15, SR-AZ-01, SR-AUD-03, SR-INP-05;
- `rbac-matrix.md` (S04, S27, D12c, bảng dữ liệu kinh doanh nhạy cảm);
- mã trên `main`: `reservations.service.ts` `update()`, `rack.service.ts` `history()`, `audit-log.controller.ts`, `audit.service.ts`, `audit-fields.ts`, các tệp `audit-entities.ts`, `checkin.service.ts` `undo()`;
- review cùng PR của vai khác (đọc sau khi SEC tự kiểm xong, để không lặp thẻ): `BE-on-contract-0313-addendum-1h.md`, `DOM-on-contract-addendum-1h.md`.

Cách kiểm:
- Đọc `git diff` gốc..HEAD của #132 và `git show b5fe802f` của #147 trong worktree tạm ở scratchpad (lấy `refs/pull/132/head`, `refs/pull/147/head`). Không checkout vào bản làm việc chung, không chạy stack, không gọi staging hay production.
- #147 đổi schema: chỉ **thêm** `ReservationPatch.closerChangeReason` và hai phản hồi `403`, `409` của `updateReservation`. `x-roles`, `x-rbac`, `x-scope`, `enum`, `required` không đổi. `openapi-schemas.ts` thêm đúng một dòng (`closerChangeReason`, `f: 'D12c'`).
- Tệp này không có bí mật, mật khẩu, dữ liệu khách hay số tỷ lệ/tiền hoa hồng.

---

## 0. Kết luận

| PR | SHA | Kết luận | Gộp khi |
|---|---|---|---|
| #132 (1g) | `c249deb0` | **DUYỆT** | CI xanh trên đúng SHA (đã xanh). Không điều kiện |
| #147 (1h) | `0943db43` | **DUYỆT CÓ ĐIỀU KIỆN** | Gộp được ngay. Điều kiện **không** chặn gộp #147, chỉ chặn bước sau: (1) chữ 1H-01 và BE 1H-01 có trong hợp đồng **trước khi gộp `r5-h1c`** (ở #147 nếu ARC còn sửa, hoặc ở delta tài liệu kế tiếp); (2) `r5-h1c` gộp **sau** #149; (3) 1H-02 trước PR-M |

0 Blocker · 0 Major · 2 Minor · 1 Suggestion (cả ba ở #147). ESC mới: **không**.

| Thẻ | Mức | Hạn |
|---|---|---|
| FB-R5-SEC-ARC-1H-01 – lý do đổi người chốt ghi ở cột `reason` của audit, không mở allowlist `reservation` cho khóa `reason` | Minor | Trước khi gộp `r5-h1c` |
| FB-R5-SEC-ARC-1H-02 – 0.3.14 (b) "OWN/MGR thấy đủ" chưa đúng cho khóa thưởng của PR-M | Minor | Trước PR-M |
| FB-R5-SEC-ARC-1H-03 – `access.denied` cho mọi 403 đổi người chốt, thứ tự 403 → 422 → 409 | Suggestion | Cùng chữ 1H-01 |

SEC đồng ý hai thẻ Suggestion của BE ở cùng PR (`BE-on-contract-0313-addendum-1h.md`):
- **FB-R5-BE-ARC-1H-01** (đơn `checked_out` chỉ nhận `closerUserId` + `closerChangeReason`, trường khác 409). Với SEC, câu này là **điều kiện (1)**, không chỉ là gợi ý. Lý do ở mục 2.2;
- FB-R5-BE-ARC-1H-02 (chữ "`earned` sau B18"): không có ý bảo mật.

Nếu nhánh có thêm commit thì SEC đọc lại phần chênh khi commit đó chạm: `x-roles`, `x-rbac`, `x-scope`, `x-write-roles`, `required`, `enum`, `pattern` trong `openapi.yaml`; mô tả `updateReservation`, `ReservationPatch.closerChangeReason`, `recordPayment` (B), `resolveAttentionEvent`, `setPropertyWifi`; `architecture.md` 5.1. Commit chỉ gộp `main` mà không chạm các chỗ đó thì không cần đọc lại.

---

## 1. PR #132 – bổ sung 1g @ `c249deb0`

### 1.1 ARC-23, ARC-24: khớp đúng điều SEC đã đòi

| Ý SEC đã đòi | Chữ ở `c249deb0` | Kết quả |
|---|---|---|
| ARC-23: hàm nhận `p_mfa_roles text[]` do guard truyền từ `MFA_REQUIRED_ROLES`; danh sách vai chỉ ở TS | Contract 1.26 và mục 2: đúng câu này. Thêm "SQL không chứa tên vai nào" | **Đạt** |
| ARC-23: bỏ `mfaRequired`/`mfaRoleCache` **cùng PR migration** | Có. Thêm "tới đó giữ phần guard tự kiểm của #100" | **Đạt**, rõ hơn chữ SEC |
| ARC-23: ba điều kiện để bỏ phần guard tự kiểm | (1) SQL không lọc theo cơ sở, cùng vị từ với đăng nhập và `getMy2fa`; (2) giữ ca nhiều cơ sở D1-02 (#124) và ca ghim `['owner','manager','front_desk_lead']`; (3) bỏ một vai khỏi tham số thì có ca đỏ | **Đạt**, đủ cả ba |
| ARC-24 ý 1: ba nhóm test bắt buộc ở PR-B3 | `recordPayment` (B), gạch mới: (i) SAL `recordPayment` cọc và SAL `confirmDeposit` → 409 **không** có `duplicateReservationCode`, FD cùng ca → có mã đơn; (ii) các ca `SEC-responses.md` 4.3, thêm số thẻ kèm hạn/CVV theo SR-PAY-10 bản 07/11; (iii) đọc lại `audit_event` của `attention_event.resolved`, `after = {kind, afterClosure: true}`, không ghi chú tự do, dòng có trong `afterClosureOnly` kèm người và giờ bấm | **Đạt. Đóng ARC-24 phần ARC.** SEC vẫn kiểm đủ ba nhóm ở review PR-B3 |
| ARC-24 ý 2: "8 chữ số cuối" | Ba chỗ trong `openapi.yaml` và api-client sinh lại đã là "8 chữ số cuối", kèm câu UXD `pay.bank_reference_card_like` (VI, EN). Không còn "8 ký tự cuối" trong `openapi.yaml`; chỉ còn ở dòng bảng 1.28 ghi việc đổi chữ | **Đạt** |

`FB-R5-SEC-ARC-23`, `FB-R5-SEC-ARC-24`: **Closed (phần ARC)**. Phần cài: ARC-23 ở PR migration 0.3.14 (BE-D), ARC-24 ở PR-B3. SEC kiểm khi được giao.

### 1.2 Không có luật SEC nào bị nới

| Chỗ đổi | So với luật SEC | Kết quả |
|---|---|---|
| Luật số thẻ của ô `bankReference` (bảng mã, `recordPayment` (B), `PaymentCreate.bankReference`, `executeRefund.bankReference`) | Trước: "toàn bộ giá trị bỏ dấu là 13–19 chữ số qua Luhn" (1f). Nay: ghép nhóm từ đầu, chặn tại ranh giới đạt, chữ cái làm hỏng mọi ranh giới sau nó. Đúng từng ý SR-PAY-10 bản 07/11 (SEC 119-01, ARC 119-03): không lặp giá trị, không lưu, không log; ô chữ tự do giữ `containsCardNumber` | **Chặt hơn 1f**, đúng SR-PAY-10 |
| Thứ tự lỗi: `VALIDATION_FAILED` trước, `CARD_NUMBER_DETECTED` chỉ khi không còn lỗi dạng (C0313-29 (b)) | SEC đã nói trung lập (`SEC-on-prs-105-119-125-128.md`): cách nào cũng không lưu và không lặp giá trị | **Đạt** |
| `setPropertyWifi`: cửa sổ = ngày UTC (`window_start` 00:00Z), hàm ở `shared/rate-limit-counter.ts`; T58-17 "tới 10 lần ở chỗ giáp hai cửa sổ" | SEC đã chấp nhận ở review #120 (`SEC-on-be-pr-120-v5-58.md`). Vẫn cửa sổ cố định, vẫn một bản câu UPSERT (SR-RL-15) | **Đạt** |
| T58-15: kiểm `app_user.failed_login_count`, `locked_until`, `status` thay cho "`login_lockout`" | Kiểm đúng trạng thái thật thay cho tên tham số | **Chặt hơn** |
| `resolveAttentionEvent` `deposit_after_cancel`: `note` bắt buộc 3–500; audit `money` `attention_event.resolved`, `after = {kind, afterClosure: true}`, **không** có `note` | Đúng S8 và ARC-20 (`SEC-responses.md` mục 5). V-09 vẫn áp cho `note` | **Đạt** |
| T14-4 (C0313-30), câu `shared/` thay `public-site/public` (C0313-26) | Chỉ thứ tự lỗi và chỗ đặt tệp. T14-3 (SAL gửi `nightlyRates` → 403) không đổi | Không có vấn đề bảo mật |

Ghi chú cho PR-B3 (không thẻ): danh sách (ii) dẫn `SEC-responses.md` 4.3 và thêm ca hạn/CVV. Bảng kiểm chứng đủ nhất là cột "Kiểm chứng" của SR-PAY-10 (có thêm `FT-4111…` → nhận, hai nhóm 14 chữ số qua Luhn → 422 có chủ ý, `-CVV123` → 422). Các ca đó đã có ở test đơn vị của hàm (#119). Ở PR-B3, SEC chỉ cần thấy hàm được nối vào **mọi** đường `PaymentCreate`, mỗi đường ít nhất một ca 422.

---

## 2. PR #147 – bổ sung 1h @ `0943db43`

### 2.1 Ma trận quyền đổi người chốt

| Mốc của đơn | 1h | Mã `main` hôm nay | Ý kiến SEC |
|---|---|---|---|
| Vai ngoài `x-roles` (SAL, CTV, HK, MT) | `x-roles` của `updateReservation` vẫn OWN/MGR/FDL/FD | Guard trả 403 + `access.denied` (SR-AZ-01) | **Đạt.** `closer_user_id` chỉ được ghi ở `update()` và lúc tạo đơn (đã tìm mọi câu `UPDATE … closer_user_id`) |
| `hold` | FD+ | Như vậy | **Đạt** |
| Chưa nhận phòng (`confirmed`) | MGR+; FD/FDL → 403 `FORBIDDEN_ACTION` | Như vậy, không ghi `access.denied` | Đạt. Gợi ý ghi `access.denied` → thẻ 1H-03 |
| Sau nhận phòng (`in_house`, `checked_out`) | **Chỉ OWN**, lý do bắt buộc; MGR/FDL/FD → 403 + **một** `access.denied` ghi sau rollback (mẫu `auditReason` của #110) | Hôm nay MGR+ đổi được ở `in_house`; `checked_out` → 409 | **Đạt.** Đúng yêu cầu DOM 131-01. 403 đi trước 422 của `closerChangeReason`, nên vai bị từ chối không dò được luật lý do |
| "Đổi" | Khác giá trị đang lưu, kể cả ghi lần đầu | `COALESCE($6, closer_user_id)`: PATCH không xóa được người chốt về `null` | **Đạt.** Lễ tân không gán được người chốt lần đầu sau nhận phòng để tạo hoa hồng |
| Người chốt mới | Không đổi luật | `closerKind`: chỉ người dùng đang hoạt động, có vai hợp lệ ở **chính cơ sở này**; kênh `agent` cần CTV | **Đạt.** Không gán được người của cơ sở khác |

Rủi ro còn lại, SEC chấp nhận **Low** (không thẻ): MGR có thể hoàn tác nhận phòng (B17), đổi người chốt khi đơn về `confirmed`, rồi nhận phòng lại. B17 chỉ được làm trong ngày nghiệp vụ của lần nhận phòng, khi chưa có dòng folio nào ghi sau giờ nhận phòng, và bắt buộc có lý do. Cả ba bước đều để lại dấu (`reservation.check_in_undone` kèm lý do, `reservation.closer_changed`, nhận phòng). DOM xem lại ca này khi review `r5-h1c`, nếu muốn chặn hẳn (ví dụ coi "đã từng nhận phòng" là mốc).

### 2.2 Đơn `checked_out` (điều kiện (1), cùng ý BE 1H-01)

- Hôm nay `update()` từ chối mọi PATCH ngoài `hold`/`confirmed`/`in_house` (409). 1h mở `checked_out` cho OWN đổi người chốt, nhưng chưa nói các trường khác.
- Nếu bản cài mở cổng trạng thái cho cả thân lệnh, thì `adults`, `children…` sẽ chạy `peopleFromNight`/`repriceExtraPersons` trên lượt ở đã đóng. Đó là **sửa tiền sau trả phòng**, và FD/FDL/MGR cũng tới được, vì luật OWN chỉ gắn với `closerUserId`.
- BE-H cho biết `r5-h1c` đã chỉ nhận `closerUserId` + `closerChangeReason` ở `checked_out`. Hợp đồng cần ghi đúng câu đó, để FE-A, QA và lần sửa sau không phải đoán. SEC kiểm ca "OWN gửi `closerUserId` + `adults` trên đơn `checked_out` → 409, không ghi gì" ở review `r5-h1c`.

### 2.3 `closerChangeReason` – chữ tự do

| Điểm kiểm | 1h | Kết quả |
|---|---|---|
| Lớp dữ liệu | `x-rbac-field: D12c` (ghi chú tự do: OWN/MGR/FDL/FD đầy, vai khác K). `getReservationHistory` chỉ FD+, nên người đọc được lý do đúng là nhóm được xem D12c | **Đạt** |
| Làm sạch | V-08 (bỏ khoảng trắng đầu/cuối, ký tự điều khiển), V-09 (số thẻ → `CARD_NUMBER_DETECTED`). Trên `main`, `Fields.text` đã gọi `stripControlChars` (SR-INP-05) rồi mới kiểm độ dài và số thẻ; BE-H dùng đúng hàm này | **Đạt** |
| Không trả lại | "không trả lại ở `Reservation`" | **Đạt** |
| Không log | Không có câu nào đưa lý do vào log ứng dụng; chỉ vào audit | **Đạt.** SEC kiểm ở `r5-h1c`: không `logger` mới mang thân lệnh |
| Nơi ghi trong audit | `after.reason` của `reservation.closer_changed`, **thêm `reason` vào allowlist `reservation`** | **Chưa ổn** → thẻ 1H-01 |
| Nội dung | "Không ghi tên, SĐT, giấy tờ của khách hay số tiền hoa hồng" | Đạt. Lý do hiện cho FD/FDL ở lịch sử đơn, nên câu nhắc này phải có trên ô nhập của Desk (UXD viết) |

### 2.4 Phản hồi 403, 409, 422: không lộ gì

- **403** dùng `Forbidden` chung (`code`, `title`). Không có tên người chốt, tỷ lệ hay trạng thái hoa hồng.
- **409** `INVALID_TRANSITION` kèm `currentState` = `payable`/`paid`. Đây là trạng thái hoa hồng, thuộc lớp "Hoa hồng – của người khác" (FD/FDL: K). Thực tế chỉ OWN tới được nhánh này:
  - hoa hồng chỉ `payable`/`paid` sau khi đơn đã đạt, tức đơn đã nhận phòng;
  - từ mốc đó chỉ OWN qua được kiểm quyền;
  - DOM ghi thêm: v1.0.5 chưa có luồng chi, nên nhánh này chưa tới được.

  Điều kiện để giữ đúng như vậy: kiểm quyền (403) phải đứng **trước** kiểm hoa hồng (409). `r5-h1c` đã làm thế (BE: kiểm quyền ngay sau `loadReservation(forUpdate)`, 409 ở đầu `syncCommissionOnly`). Hợp đồng chưa ghi → thẻ 1H-03. Thân 409 không có số tiền, tên hay id người hưởng.
- **422** `NOT_ALLOWED` (gửi lý do mà không đổi người chốt), `REASON_REQUIRED`, `TOO_LONG`, `CARD_NUMBER_DETECTED`: chỉ `field` + `code`, không lặp lại chữ đã gửi.

### 2.5 `architecture.md` 5.1 – cổng `audit-visibility` có đóng được 131-01 không

| Ý của 131-01 | 5.1 | Kết quả |
|---|---|---|
| (1) Lọc `entity_type` hoa hồng khi người gọi không có OWN/MGR, bỏ khóa `commissionVnd` | `auditVisibleWhere` (mệnh đề SQL) + `redactAuditFields` (bỏ khóa). Module chủ dữ liệu tự khai báo (`folio/audit-entities.ts`: `commission`, `commissionVnd`), tệp được mọi tiến trình nạp | **Đạt** |
| Cả hai đường đọc | Luật: mọi nơi đọc `audit_event` trả cho người không có OWN/MGR phải dùng **cả hai** hàm. Hôm nay là `listAuditEvents` và `getReservationHistory` | **Đạt.** Đường lịch sử đơn còn quan trọng hơn: nó trả mọi bản ghi của đơn (theo `entity_code`), **không** chỉ bản ghi của chính người gọi, nên FD thấy cả hoa hồng do người khác ghi. 5.1 phủ đường này |
| Lọc lúc đọc, che cả dữ liệu đã có trên production | "không đổi cách ghi, không migration; bản ghi đã có trên production cũng được che" | **Đạt** |
| Không để lọt nơi đọc thứ ba | Test quét mọi `FROM audit_event` trong `src`, ngoại lệ có lý do (`work-orders.service.ts`, `auth.service.ts` mfa, `line-reductions.ts` chỉ đếm) | **Đạt về thiết kế.** Ba ngoại lệ đúng: lịch sử phiếu việc chỉ `entity_type = 'work_order'`; `auth.service.ts` chỉ `SELECT 1`; `line-reductions.ts` chỉ trả `{actorUserId, n}` cho mục Cần chú ý chỉ OWN. Phần cài kiểm ở `SEC-on-be-h-pr-149.md` (#149 quét cả `JOIN`, không phân biệt hoa thường) |
| (3) Câu hợp đồng cho `listAuditEvents` | 0.3.14 (b): "FD/FDL không thấy bản ghi `entityType = commission`; khóa `commissionVnd` … bị bỏ khỏi `before`/`after`" | **Đạt**, trừ nửa câu về khóa thưởng → thẻ 1H-02 |
| (4) PR-M: thưởng của quản lý chỉ OWN và chính MGR đó thấy | 5.1 chỉ có một mức "OWN/MGR"; 0.3.14 (b) ghi "OWN/MGR thấy đủ" kể cả khóa thưởng | **Chưa đạt** → thẻ 1H-02 |

Phụ thuộc thứ tự (điều kiện (2)): `r5-h1c` ghi `commission.voided`/`commission.projected` (có `ratePct`) dưới tên OWN, cùng `entity_code` của đơn. Nếu `r5-h1c` lên `main` trước #149, FD/FDL thấy các dòng đó ở lịch sử đơn. #149 chặn tag, `r5-h1c` thì không (plan 4a T18, T19), nên ORC giữ thứ tự gộp: #149 trước.

### 2.6 Danh sách 0.3.14 (a)–(h) so với thẻ SEC

| Mục | Thẻ SEC | So | Kết quả |
|---|---|---|---|
| (b) | 131-01 | Như mục 2.5 | Đạt, trừ khóa thưởng (1H-02) |
| (c) | S1-01, S1-03 (đã duyệt ở #123) | Vai không được phép dùng lại `Idempotency-Key` với thân khác → 403 (trước là 422); phát lại multipart sau khi mất vai → 403; guard chỉ nhường cho lần phát lại thật, so bằng `request_hash` | **Đạt** |
| (e) | 123-01 | Lồng quá 32 tầng → 422 `VALIDATION_FAILED`, kiểm trong `request-hash.ts` cho **mọi** nơi gọi (gồm `public-booking.service.ts`, đường không cần đăng nhập); ở guard, `requestHash` lỗi thì coi như không có lần phát lại → 403 kèm `access.denied`, không bao giờ 5xx | **Đạt**, đúng hai ý sửa của thẻ. Số tầng do BE-H chốt; mô tả #149 ghi schema sâu nhất là 5 tầng, nên 32 có dư mà vẫn xa ngưỡng gây `RangeError` |
| (f) | V558-01, SR-RL-15 | "Lần lượt": lỗi `ssid` trước, không so, không đếm | **Đạt.** SR-RL-15 (07/11) đã có câu "chỉ so khi mọi kiểm khác của request đã qua", nên SEC không cần thêm câu mới |
| (a), (d), (g), (h) | – | Khung tháng của số đếm, `dates[]` của B13, `checkoutTimeNoteRequired`, tham số lặp `action` | Không có ý bảo mật. (d): `dates[]` chỉ gửi cho người có quyền B13, không thêm biên giá của đêm khác (như SEC đã ghi ở #123) |

---

## 3. Thẻ feedback

### FB-R5-SEC-ARC-1H-01
- Mức độ: **Minor**. Không chặn gộp #147. Phải sửa trước khi gộp `r5-h1c`.
- Người nhận: ARC (chữ hợp đồng), BE-H (`r5-h1c`)
- Vị trí: `openapi.yaml` `updateReservation` (gạch "Audit `money` `reservation.closer_changed` … thêm `after.reason` khi có lý do (allowlist `reservation` thêm `reason`)"); `ReservationPatch.closerChangeReason` ("Ghi vào `after.reason`"); `reservations/audit-entities.ts` ở `r5-h1c` (BE ghi đã thêm `reason`).
- Vấn đề:
  - Allowlist (SR-AUD-03) chỉ cho **sự kiện**: trạng thái, số tiền, id. Chữ tự do của mọi thao tác trên đơn hiện đều ghi ở **cột** `audit_event.reason` (`AuditEntry.reason`), không ở `after`. Ví dụ: hủy đơn, `reservation.priced`, gia hạn, phụ thu trả muộn, thêm người theo giấy tờ.
  - Thêm khóa chung `reason` vào allowlist `reservation` mở cửa cho **mọi** thao tác của thực thể này. Lần sau, ai rải một object có `reason` vào `after` (ví dụ chữ khách gõ, ghi chú FD) thì chữ đó được lưu vào audit mà không ai duyệt.
  - Lý do có hai chỗ để đọc (`after.reason` và `reason`), nên Desk và bộ lọc dễ lệch.
- Vì sao quan trọng: allowlist là lớp chặn C2/C3 lọt vào audit (SR-AUD-03). Audit chỉ ghi thêm, không bao giờ xóa, nên chữ đã lọt thì nằm đó tới hết hạn lưu.
- Đề xuất sửa:
  1. Ghi lý do vào `AuditEntry.reason` (cột `reason`) như mọi thao tác khác của đơn. `listAuditEvents` và `getReservationHistory` đã trả trường `reason`.
  2. **Không** thêm `reason` vào allowlist `reservation`. Thêm `closerUserId` thì đúng (theo BE, các bản ghi cũ đang rỗng vì thiếu khóa này): đó là id, không phải chữ tự do.
  3. Sửa hai câu trong `openapi.yaml`: "ghi vào `reason` của audit `reservation.closer_changed`".
  4. Test ở `r5-h1c`: đọc lại `audit_event` → `reason` = lý do đã làm sạch, `after` chỉ có `closerUserId`.
- Trạng thái: Open

### FB-R5-SEC-ARC-1H-02
- Mức độ: **Minor**. Không chặn gộp #147, không chặn tag v1.0.5. Phải sửa trước PR-M.
- Người nhận: ARC (chữ 0.3.14 (b), `architecture.md` 5.1), BE (PR-M)
- Vị trí: `contract-0.3.13.md` 1.26, 0.3.14 (b): "khóa `commissionVnd` (và khóa thưởng của PR-M) bị bỏ khỏi `before`/`after`. OWN/MGR thấy đủ"; `architecture.md` 5.1: "PR-M thêm khóa thưởng cùng cách".
- Vấn đề:
  - 131-01 ý 4 (`SEC-on-be-h-prs-110-131.md` mục 2.5): thưởng của quản lý chỉ **OWN và chính MGR đó** thấy, như `getManagerPerformanceBonus` (`scope: manager own`).
  - `defineManagerOnlyAudit` chỉ có một mức "OWN/MGR". "Khai khóa thưởng cùng cách" nghĩa là **mọi** MGR đọc được thưởng của MGR khác trong nhật ký hoạt động (MGR xem audit với phạm vi toàn bộ).
- Vì sao quan trọng: thưởng là thu nhập cá nhân của từng quản lý (C2, dữ liệu nhân sự). Dữ liệu này không được cho người cùng cấp xem.
- Đề xuất sửa (chọn một, ghi vào 0.3.14 (b) và 5.1):
  - (a) PR-M **không ghi số thưởng** vào `before`/`after` của audit, chỉ ghi id và trạng thái. Số thưởng tính lúc đọc từ `getManagerPerformanceBonus`. Đơn giản nhất, SEC đề xuất cách này;
  - (b) Cổng thêm chế độ "OWN và người được thưởng" (ví dụ `defineOwnerOrSubjectAudit({ entityTypes, subjectKey })`), lọc theo `actor`/`subject` lúc đọc, có test MGR khác → không thấy.
- Trạng thái: Open

### FB-R5-SEC-ARC-1H-03
- Mức độ: Suggestion. Làm cùng chữ 1H-01, trước khi gộp `r5-h1c`.
- Người nhận: ARC (chữ), BE-H (`r5-h1c`), BA (`rbac-matrix`, nếu đồng ý ý 3)
- Vị trí: `openapi.yaml` `updateReservation`, gạch "Quyền theo mốc" và gạch "409".
- Vấn đề:
  1. Nhánh "chưa nhận phòng, FD/FDL → 403" không ghi `access.denied`, trong khi nhánh "sau nhận phòng" có. Phản hồi `Forbidden` mà 1h vừa khai cho operation này ghi "lần bị từ chối được ghi nhật ký" (cũng là chú thích ✖ của `rbac-matrix.md`, US-002 AC2). Người chốt quyết định ai nhận hoa hồng (SEC-BE-26: thao tác tiền). Lễ tân cố đổi người chốt sau xác nhận là lần thử đáng ghi.
  2. Hợp đồng ghi "403 đi trước 422 của `closerChangeReason`" nhưng chưa ghi 403 đi trước 409. Nếu một bản sửa sau đảo thứ tự, FD sẽ biết hoa hồng của người khác đã `payable`/`paid` (mục 2.4).
  3. Luật theo mốc chỉ nằm trong chữ mô tả. `rbac-matrix` không có dòng "đổi người chốt", nên `rbac-cases` không kiểm được bằng máy.
- Vì sao quan trọng: nhật ký từ chối đủ, và thứ tự lỗi cố định, là hai thứ giữ cho luật quyền không bị lách khi sửa mã về sau.
- Đề xuất sửa:
  1. Mọi 403 vì đổi người chốt (cả hai nhánh) ghi **đúng một** `access.denied`, mẫu `auditReason` (ví dụ `CLOSER_CHANGE_BEFORE_CHECKIN`, `CLOSER_CHANGE_AFTER_CHECKIN`). Không ghi lý do người gọi gõ.
  2. Thêm câu "thứ tự: 403 → 422 (`closerUserId`, `closerChangeReason`) → 409 (hoa hồng `payable`/`paid`)".
  3. BA cân nhắc thêm dòng hành động "Đổi người chốt" vào `rbac-matrix` (`hold` FD+, trước nhận phòng MGR+, sau nhận phòng OWN), để QA sinh ca. Nếu đổi `rbac-matrix`, nhớ đổi cùng tệp màn hình mà CI so (bài học ngày 06/11: chỉ đổi tài liệu thì `main` đỏ).
- Trạng thái: Open

---

## 4. Điểm làm tốt
- 1g sửa đúng chữ SEC đã đòi, không hơn không kém. Luật `bankReference` ở cả bốn chỗ được viết lại theo SR-PAY-10 bản 07/11, nên BE-D không còn hai bản luật để chọn.
- 1h viết luật quyền **trước** khi BE-H mở `r5-h1c`, có đủ: kiểm dưới khóa đơn, 403 trước 422, `access.denied` sau rollback, 409 không ghi gì. Bảng 1.29 đọc một lần là hiểu ai được làm gì ở mốc nào.
- 5.1 để module chủ dữ liệu tự khai cái gì là chỉ OWN/MGR, còn module `audit` không cần biết hoa hồng là gì. Lọc lúc đọc nên che được cả bản ghi đã có trên production, không cần migration.

---

## 5. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – hợp đồng 0.3.13 bổ sung 1g (PR #132 @ c249deb0): DUYỆT; bổ sung 1h (PR #147 @ 0943db43, commit riêng b5fe802f): DUYỆT CÓ ĐIỀU KIỆN.** 1g: ARC-23 (p_mfa_roles từ MFA_REQUIRED_ROLES, SQL không tên vai, bỏ mfaRoleCache cùng PR migration, đủ 3 điều kiện SEC) và ARC-24 (3 nhóm test PR-B3, "8 chữ số cuối") Closed phần ARC; luật bankReference theo SR-PAY-10 bản 07/11 (chặt hơn 1f), cửa sổ Wi-Fi ngày UTC đã được SEC nhận ở #120, deposit_after_cancel note bắt buộc và audit không note – không luật SEC nào bị nới. 1h: chỉ thêm closerChangeReason (D12c, V-08 qua stripControlChars, V-09) và 403/409; sau nhận phòng chỉ OWN, MGR/FDL/FD 403 + access.denied, 403 trước 422; 409 currentState chỉ OWN tới được; architecture 5.1 (auditVisibleWhere + redactAuditFields ở listAuditEvents và getReservationHistory, scan test, lọc lúc đọc) đóng được 131-01 trên cả hai đường; 0.3.14 (c)(e)(f) khớp S1-01/S1-03, 123-01, SR-RL-15. Điều kiện: chữ "checked_out chỉ nhận closerUserId + closerChangeReason, trường khác 409" (BE 1H-01, SEC coi là điều kiện) và 1H-01 trước khi gộp r5-h1c; r5-h1c gộp sau #149; 1H-02 trước PR-M. Thẻ: 1H-01 Minor (lý do vào cột audit reason, không thêm reason vào allowlist reservation), 1H-02 Minor (khóa thưởng PR-M chỉ OWN và chính MGR đó), 1H-03 Suggestion (access.denied cả nhánh trước nhận phòng, thứ tự 403 → 422 → 409, dòng rbac-matrix). Rủi ro Low chấp nhận: MGR hoàn tác nhận phòng cùng ngày rồi đổi người chốt (có lý do và audit). Không ESC | SEC | rounds/round-05/reviews/SEC-on-contract-0313-addenda-1g-1h.md |`
