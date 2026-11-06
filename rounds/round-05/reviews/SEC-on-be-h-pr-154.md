# SEC – Review BE-H PR #154 (`r5-h1c`, V5-30 bổ sung 1h) @ `279b5492` (phủ cả `4e81c3be`)

Round 5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Gốc (merge-base với `main`) | Phần của PR | CI lúc đọc |
|---|---|---|---|---|---|
| #154 (nháp) | `r5-h1c` | Review ở **`279b5492`** | `8598bb5a` (#123 đã gộp) | 12 tệp, +1310 −35. Mã: `reservations.service.ts` `update()`, `reservations.controller.ts`, `money-bridge.ts`, `folio-sync-port.ts`, `reservations/audit-entities.ts`, `folio.service.ts` (`syncCommissionOnly`, `ensureCommission`, `tryEarnCommissions`, `syncCommission`), `shared/http/request-hash.ts`, `shared/http/auth.guard.ts`. Test: `v5-30-closer-change` (mới), `write-roles-gate`, `request-hash-guard-units`, `v5-16-br438-checkout` | Ở `279b5492`: 8/9 job xanh (gồm `RBAC --strict`, gitleaks, confidential paths), E2E smoke đang chạy |
| #154 | `r5-h1c` | HEAD mới **`4e81c3be`** | `c058c5f0` | Chỉ gộp `main` @ `c058c5f0` (#149 đã gộp ở `c2d5588d`, #153, #151). Hai cha: `279b5492`, `c058c5f0` | Ở `4e81c3be`: 4 job đã xanh, các job còn lại đang chạy |

Không migration, không sửa `openapi.yaml` hay tệp sinh.

**Kết luận của tệp này phủ cả `4e81c3be`.** SEC tự kiểm commit gộp:
- `git show --remerge-diff 4e81c3be` **rỗng** (0 dòng): không sửa tay gì ngoài phần gộp tự động sạch. ORC cũng đã kiểm và cho cùng kết quả.
- `80f2d239` (đầu #149) nằm trong `c058c5f0`; #149 ở trạng thái MERGED.
- Chạy lại ở `4e81c3be` (sau `db:migrate`): `v5-30-closer-change`, `audit-visibility-commission`, `write-roles-gate`, `request-hash-guard-units` cùng các probe P1 và P4: **5 tệp, 68/68 qua**. P4: FD/FDL không còn thấy khóa hay hành động hoa hồng nào ở lịch sử đơn, MGR thấy đủ. P1: MGR/FDL/FD vẫn nhận 403, không có `currentState`.

Đối chiếu:
- `SEC-on-contract-0313-addenda-1g-1h.md`: thẻ 1H-01, 1H-03, điều kiện (1)–(2), mục 2.2 và 2.4;
- `SEC-on-be-h-prs-110-131.md`: thẻ FB-R5-SEC-BE-123-01;
- chữ `updateReservation` và `ReservationPatch.closerChangeReason` của hợp đồng 1h (#147 @ `0943db43`) và 1i (#152 @ `ca276f8a`);
- SR-AUD-03 (allowlist audit), SR-AZ-01 (`access.denied`), SR-INP-05 / V-08 / V-09, G3;
- `DOM-on-be-h-pr-154.md`: SEC đọc sau khi tự kiểm xong, để không lặp thẻ.

Cách kiểm:
- Lấy `refs/pull/154/head` và `refs/pull/149/head` vào ref tạm, đọc `git diff 8598bb5a..279b5492` trong worktree riêng ở scratchpad. Không checkout vào bản làm việc chung, không gọi staging hay production. Worktree, hai ref tạm và container đã xóa sau review.
- Chạy test trên PostgreSQL 17 tạm (container riêng của SEC, vai `ottimo_app` như CI).
- 15 đột biến của SEC (mục 4), 5 probe (P1–P5).
- Gộp thử #149 @ `80f2d239` vào `279b5492`: không xung đột (hai PR không chung tệp nào). Commit gộp thử chỉ ở worktree tạm, không đẩy lên đâu.
- Tệp này không có bí mật, dữ liệu khách hay số tỷ lệ/tiền hoa hồng. Dữ liệu trong probe là dữ liệu giả của fixture.

---

## 0. Kết luận

**DUYỆT CÓ ĐIỀU KIỆN** PR #154 @ `279b5492`. Không có điều kiện về mã. Hai điều kiện về thứ tự gộp:

1. **#154 gộp sau #149.** Probe P4 cho thấy: nếu thiếu #149, FD/FDL đọc được `ratePct`, `baseVnd`, `commissionVnd` ở lịch sử đơn. Lý do là PR này ghi thêm `commission.voided`/`commission.projected` dưới tên MGR/OWN, cùng `entity_code` của đơn. Gộp thử với #149 thì FD/FDL không còn thấy gì về hoa hồng, MGR vẫn thấy đủ (mục 3.3).
2. **Commit gộp `main` sau đó chỉ là gộp.** `git show --remerge-diff` rỗng thì SEC không cần đọc lại. Không rỗng mà chạm các chỗ ở mục 6 thì SEC đọc lại phần chênh.

**Ở `4e81c3be` cả hai điều kiện đã đạt:** #149 đã lên `main` và nằm trong commit gộp; remerge-diff rỗng. Vậy về phía SEC, **#154 @ `4e81c3be` gộp được** khi CI xanh trên đúng SHA đó (gồm E2E smoke; ORC tự kiểm). Commit nào khác ngoài một lần gộp sạch thì áp lại mục 6.

0 Blocker · 0 Major · 2 Minor · 1 Suggestion. Không thẻ nào chặn gộp. ESC mới: **không**.

| Thẻ | Mức | Hạn |
|---|---|---|
| FB-R5-SEC-BE-154-01 – `addGuestDocument` gọi `canonicalJson` trực tiếp: `data` lồng sâu → 500 (chỗ thẻ 123-01 liệt kê sót) | Minor | v1.0.5 nếu tiện (PR nhỏ), không thì v1.0.6 B-KYTHUAT |
| FB-R5-SEC-BE-154-02 – chưa có test "403 đi trước 409 hoa hồng `payable`/`paid`" (đột biến X1 sống) | Minor | Rẻ nhất: một commit chỉ thêm test vào #154 trước khi gộp, hoặc PR test riêng ngay sau. Muộn nhất: PR luồng chi (US-089) |
| FB-R5-SEC-BE-154-03 – thân lệnh gộp (`closerUserId` + cờ khác) trả 409 mà không ghi `access.denied` | Suggestion | Lần sửa `update()` kế tiếp |

Thẻ cũ:

| Thẻ | Kết quả @ `279b5492` |
|---|---|
| FB-R5-SEC-ARC-1H-01 (lý do vào cột `reason`, không vào `after`) | **Đạt.** Đóng khi #154 gộp. Phần chữ hợp đồng: #152 (`b722fbc4`) |
| FB-R5-SEC-ARC-1H-03 | Ý 1 (`access.denied` cả hai nhánh) **đạt**. Ý 2 (thứ tự 403 → 422 → 409): mã **đạt**, test còn thiếu nhánh 409 → 154-02. Ý 3 (dòng `rbac-matrix`): đã chuyển sang 0.3.14 (j), BA làm. Thẻ còn **Open** chỉ vì ý 3 |
| Điều kiện (1) của review 1h / FB-R5-BE-ARC-1H-01 (`checked_out` chỉ nhận người chốt + lý do) | **Đạt** (mục 1.3) |
| FB-R5-SEC-BE-123-01 (thân lồng sâu → 500 ở guard) | **Đạt** cho mọi nơi gọi `requestHash`. Đóng khi #154 gộp. Chỗ gọi `canonicalJson` trực tiếp: thẻ mới 154-01 |
| ARC FB-R5-ARC-BE-123-02 (ca "không khớp" phải thật sự so hash) | Không phải thẻ SEC. SEC đồng ý: `guardWithStored` chỉ trả dòng khi câu SQL lọc `request_hash = $5` và `$5` đúng là hash đã lưu |

---

## 1. Năm điểm ORC yêu cầu kiểm

### 1.1 Không có PII hay chữ người dùng gõ trong `audit`/`after`/dòng từ chối

| Dòng ghi | Nội dung @ `279b5492` | Kết quả |
|---|---|---|
| `reservation.closer_changed` (money) | `before`/`after` = `{ closerUserId }` (id nhân viên); lý do ở **cột** `reason`, đã qua `Fields.text` (bỏ ký tự điều khiển, V-08, V-09) | **Đạt.** Probe P3: lý do có U+202E, U+200B và NUL được lưu là chữ sạch; `after` chỉ có `closerUserId` |
| Allowlist `reservation` | Chỉ thêm `closerUserId`. Không có khóa `reason` (có test kiểm) | **Đạt.** Đột biến M15 (thêm lại `reason`) đỏ |
| `access.denied` của 403 đổi người chốt | `reason` = hằng `CLOSER_CHANGE_BEFORE_CHECKIN` / `CLOSER_CHANGE_AFTER_CHECKIN`; `after` = `{ operationId, roles }`; ghi sau rollback, giao dịch riêng (`recordUseCaseDenial`) | **Đạt.** Allowlist `operation` (`operationId`, `roles`, `fields`) là lớp chặn thứ hai: đột biến X2 thêm khóa lạ vào `after` bị allowlist bỏ, test vẫn xanh (đột biến tương đương). X2b đưa chữ đã gõ vào `fields` thì test đỏ |
| `commission.voided` (mới cho dòng `earned`) | `before` = `{ status, amountVnd }`, `after` = `{ status, voidReason }`. Thực thể `commission` | Đúng mẫu các luồng hoa hồng khác. Chỉ an toàn khi có #149 → điều kiện 1 |
| Phản hồi lỗi | 403: `detail` cố định, không tên, không id người chốt. 422: chỉ `field` + `code`, không lặp chữ đã gửi. 409: `currentState` | **Đạt** |
| Log ứng dụng | Không thêm `logger` nào. Lỗi 500 ở probe P5 chỉ ghi `RangeError` kèm `requestId`, không có dữ liệu giấy tờ | **Đạt** |

Dữ liệu test là dữ liệu giả của fixture. Lý do mẫu là câu chung ("Ghi nhầm người chốt lúc tạo đơn"), không có tên, SĐT hay giấy tờ.

### 1.2 G3 – không có số hoa hồng hay số thưởng

- Mã nguồn: không có hằng tỷ lệ hay số tiền hoa hồng. Tỷ lệ luôn đọc từ tỷ lệ đã ghim của đơn (`rate_pct_snapshot`) hoặc bảng tham số.
- Test: chỉ có hằng thử có tên `test_rate_short`, cùng quy ước với #149 và các test V5-30 khác. Số tiền hoa hồng tính bằng `applyPct`, không viết thẳng. `amountVnd: 100_000` trong ca DOM 1H-04 là **khoản thu** người chốt cũ ghi, không phải hoa hồng.
- Mô tả PR và các thông điệp commit: không có số. Job `confidential paths` xanh.
- Không có gì về thưởng (SEC 1H-02 thuộc PR-M, phương án (a) đã vào #152).

**Đạt.**

### 1.3 Phân quyền trên mọi đường

| Đường | Kiểm | Kết quả |
|---|---|---|
| Vai ngoài `x-roles` của `updateReservation` (SAL, CTV, HK, MT) | Guard 403 + `access.denied`, như trước. `x-roles` không đổi | **Đạt** |
| `hold` | FD+ đổi được; lý do tùy chọn; không đồng bộ hoa hồng (đơn giữ chỗ chưa có dòng hoa hồng) | **Đạt** |
| Ngoài `hold`, chưa nhận phòng | MGR+; FD/FDL → 403 + đúng một `access.denied` `CLOSER_CHANGE_BEFORE_CHECKIN` | **Đạt.** Đột biến M11, M16, M17 đỏ |
| Sau nhận phòng (`actual_checkin_at` có giá trị, `in_house`, `checked_out`) | Chỉ OWN, lý do bắt buộc; MGR/FDL/FD → 403 + đúng một `access.denied` `CLOSER_CHANGE_AFTER_CHECKIN` | **Đạt.** M2 đỏ (15 ca) |
| `checked_out` (BE 1H-01, mục 2.2 review 1h) | `editable` chỉ mở khi người chốt **đổi** và thân **chỉ** có `closerUserId`/`closerChangeReason`. Có trường khác → 409, không ghi gì. Test kiểm `adults`, `etaTime`, `closerUserId` + `adults`, `closerUserId` + `internalNote`, cùng người chốt + lý do: người chốt, số khách, phiên bản, hoa hồng, dòng folio và audit đều không đổi | **Đạt.** M18 đỏ. Không còn đường sửa tiền sau trả phòng qua PATCH |
| Người chốt mới | `closerKind`: chỉ người dùng đang hoạt động có vai hợp lệ ở chính cơ sở này; kênh `agent` cần CTV (không đổi) | **Đạt** |
| `syncCommissionOnly` | Chỉ được gọi từ `update()` (qua `MoneyBridge.closerChanged`), sau khi đã qua kiểm quyền. Không có endpoint mới | **Đạt** |
| `ensureCommission`, `tryEarnCommissions` (DOM 1H-04) | Gọi nội bộ ở B18, đối soát, thu/xóa nợ. Câu con `recorded_by IN (SELECT payee_user_id FROM commission WHERE reservation_id = …)` có tham số, chạy dưới RLS của cơ sở | **Đạt.** Không có quyền mới |
| Màn Hoa hồng (`listCommissions`, phạm vi của chính mình) | Người chốt cũ thấy dòng `void` của mình, người mới thấy dòng `projected` của mình | **Đạt.** Mỗi người chỉ thấy dữ liệu của mình |

Rủi ro còn lại, giữ mức **Low** như review 1h (không thẻ): B17 (hoàn tác nhận phòng) đặt `actual_checkin_at = NULL`. Vì vậy MGR vẫn có thể hoàn tác nhận phòng trong ngày, đổi người chốt theo luật "chưa nhận phòng", rồi nhận phòng lại. Cả ba bước đều có lý do và để lại audit. DOM không nêu ca này ở `DOM-on-be-h-pr-154.md`, nên SEC giữ chấp nhận.

### 1.4 Thứ tự lỗi 403 → 422 → 409

| Bước trong `update()` | Lỗi | Ý kiến SEC |
|---|---|---|
| Đọc thân lần 1, `f.done()` trước khi tải đơn | 422 dạng (ví dụ `closerUserId` không phải UUID) | Chấp nhận. Lỗi dạng không phụ thuộc trạng thái đơn và không cho biết gì về luật người chốt. `closerChangeReason` **không** được đọc ở bước này |
| Tải đơn `FOR UPDATE`, `editable` | 409 `currentState` = trạng thái **đơn** | Chấp nhận. FD đọc được trạng thái đơn. Ca thân gộp: thẻ 154-03 |
| `closerKind` | `f.add`, chưa ném | Đúng: 403 vẫn thắng `NOT_IN_LIST` |
| Kiểm quyền người chốt | **403** | Trước mọi 422 của `closerUserId`/`closerChangeReason`. Test (a), (b): FDL/MGR gửi lý do `x` vẫn nhận 403. Đột biến X7 (đọc lý do và `f.done()` trước 403) làm đỏ 15 ca |
| `closerChangeReason`, `f.done()` lần 2 | **422** | Đúng |
| Ghi, rồi `syncCommissionOnly` | **409** `payable`/`paid` | Đúng về cấu trúc. Probe P1: MGR, FDL, FD trên đơn có hoa hồng `payable` nhận 403, không có `currentState`, thêm 3 dòng `access.denied`. **Chưa có test** giữ thứ tự này → 154-02 |

### 1.5 Thân lệnh lồng sâu không gây 5xx

| Đường | @ `279b5492` | Kết quả |
|---|---|---|
| `requestHash` (UnitOfWork, `completedReplay`, đơn vị công việc của khách, web đặt phòng công khai) | `bodyTooDeep` duyệt bằng ngăn xếp, chạy **trước** `withoutSecrets`/`canonicalJson` → 422 `VALIDATION_FAILED` | **Đạt.** Probe P5: 422 ở mọi độ sâu SEC thử, từ 1.000 tới 100.000 tầng |
| Guard `hasCompletedKey` | `try/catch` quanh `requestHash` → `false` → quyết định vai giữ nguyên: 403 + `access.denied` | **Đạt.** Test tích hợp: SAL gửi `nightlyRates` + thân 10.000 tầng → 403 + đúng một `access.denied`; không có `nightlyRates` → 422; không lưu báo giá. S2 đỏ |
| Giới hạn 32 tầng | Schema sâu nhất của `openapi.yaml` là 5 tầng; object và mảng đều tính là một tầng; giá trị nhị phân không tính | **Đạt.** S1 (bỏ kiểm) và S5 (nới lên 64) đỏ |
| `registration.controller.ts` `addDocument`: `canonicalJson(data)` gọi **trực tiếp**, không qua `requestHash` | Phần `data` của multipart (tới 64 KB) qua `JSON.parse`, rồi `validateDocumentInput` (chỉ đọc khóa đã biết), rồi `canonicalJson` đệ quy | **Chưa đạt → 154-01.** Probe P5: FD (thiết bị tin cậy), trường hợp lệ cộng một khóa lồng 10.000 tầng → **500**. Không phải lỗi do #154 tạo ra |

Ngưỡng đo được trong cùng tiến trình Node 22 (độ sâu mảng lồng, cỡ thân):

| Hàm | Ném `RangeError` từ |
|---|---|
| `withoutSecrets` | khoảng 2.000 tầng (khoảng 4 KB) |
| `canonicalJson` | khoảng 3.000 tầng (khoảng 6 KB) |
| `JSON.stringify` | khoảng 8.000 tầng (khoảng 16 KB) |
| `JSON.parse` | không ném, tới 100.000 tầng |
| `requestHash` | không bao giờ: luôn 422 từ 33 tầng |

Các đường khác SEC đã rà:
- Đường web công khai (giới hạn 8 KB) gọi `JSON.stringify(body)` khi thiếu `content-length`. Ở 8 KB, độ sâu tối đa khoảng 4.000 tầng, dưới ngưỡng `JSON.stringify`. Không thẻ.
- Bộ định dạng log gọi `withoutSecrets` trên đối tượng log. Bộ tuần tự hóa `req` chỉ có `id`, `method`, `route`, không có thân lệnh. Không thẻ.
- Tải giấy tờ của khách (`uploadGuestDocument`) chỉ đọc trường phẳng, không có JSON. Không thẻ.

---

## 2. Phần hoa hồng đi theo người chốt (đọc dưới góc SEC)

- Khóa: đơn (L1, `loadReservation` `FOR UPDATE`) → folio (`lockFolio`) → các dòng `commission` `FOR UPDATE`. Cùng thứ tự với B18, nên không mở thêm đường deadlock giữa PATCH và trả phòng.
- 409 `payable`/`paid` ném trong cùng giao dịch, sau khi đã ghi `reservation.closer_changed`. Rollback xóa cả hai. Test kiểm: không có audit, phiên bản và hoa hồng không đổi.
- `recordUseCaseDenial` chỉ ghi khi lỗi là `FORBIDDEN_ACTION` **và** `auditReason` thuộc hai hằng của controller. 409, 422 và 403 khác không ghi gì. Guard không chạy tới use case với vai ngoài `x-roles`, nên không có dòng từ chối trùng.
- DOM 1H-04: người chốt cũ ghi khoản thu chưa đối soát thì giữ người mới ở `projected`. Không có quyền mới; MGR vẫn là người đối soát. Nghiệp vụ thuộc DOM (đã duyệt).

---

## 3. Bằng chứng SEC tự chạy

### 3.1 Test của PR @ `279b5492`

`v5-30-closer-change`, `v5-30-commission-ensure`, `v5-16-br438-checkout`, `write-roles-gate`, `request-hash-guard-units`: **5 tệp, 55/55 qua.**

### 3.2 Gộp thử #149 @ `80f2d239` vào `279b5492`

- Không xung đột.
- `tsc --noEmit` sạch. Toàn bộ API Vitest xanh: 217 tệp qua, 2 bỏ qua; 5165 ca qua, 24 bỏ qua, 1 todo.
- `audit-visibility-commission`, `audit-visibility-gate`, `v5-30-closer-change` cộng các probe: 47/47 qua.

### 3.3 Probe

| Probe | Làm gì | Kết quả |
|---|---|---|
| P1 | Đơn đã trả phòng, hoa hồng `payable`. MGR, FDL, FD PATCH `closerUserId` + lý do | Cả ba 403 `FORBIDDEN_ACTION`, không có `currentState`. `access.denied` +3 |
| P2 | FD, đơn **đang ở** O: (i) `closerUserId` + `roomDisclosedToGuest`; (ii) `closerUserId` + `doorAccessHandedOver`. FD, đơn **đã trả phòng**: `closerUserId` + `adults`, `closerUserId` + một cờ | (i) 409 `INVALID_TRANSITION` (`currentState` = `in_house`), `access.denied` +0 → 154-03. (ii) 403 + một `access.denied`; nhánh cờ đã ghi `door_access_handed_over_at` rồi bị rollback (đọc lại: `null`). Đã trả phòng: 409, không ghi gì, `access.denied` +0 (đúng hợp đồng 1i) |
| P3 | OWN đổi người chốt, lý do có U+202E, U+200B, NUL | 200. Cột `reason` = chữ sạch; `after` = `{ closerUserId }` |
| P4 | Sau khi MGR đổi người chốt của đơn A: FD, FDL, MGR đọc `GET …/reservations/{id}/history` | **Không có #149:** FD/FDL thấy `commission.voided`, `commission.projected`, `ratePct`, `baseVnd`, `commissionVnd`. **Có #149:** FD/FDL không thấy khóa hay hành động hoa hồng nào; MGR thấy đủ → điều kiện 1 |
| P5 | Độ sâu thân lệnh: các hàm băm (mục 1.5); HTTP `addGuestDocument` với `data` lồng 10.000 tầng, cả mã đăng ký thật lẫn UUID ngẫu nhiên | `requestHash` luôn 422. `addGuestDocument` 500 cả hai lần → 154-01 |

---

## 4. Đột biến của SEC

Chạy trên `279b5492`. Mỗi đột biến chạy lại tệp test liên quan (`v5-30-closer-change`; hoặc `write-roles-gate` + `request-hash-guard-units`), rồi trả mã về như cũ.

| # | Đột biến | Kết quả |
|---|---|---|
| S1 | `requestHash` bỏ kiểm độ sâu | Đỏ (3 ca) |
| S2 | Guard để `requestHash` ném lỗi | Đỏ (2) |
| S5 | `MAX_BODY_DEPTH` = 64 | Đỏ (3) |
| M14 | Lý do vào `after` thay vì cột `reason` | Đỏ (3) |
| M15 | Thêm `reason` vào allowlist `reservation` | Đỏ (1) |
| X3 | Cột `reason` ghi chữ thô chưa làm sạch | Đỏ (1) |
| M16 | Bỏ `auditReason` của 403 trước nhận phòng | Đỏ (2) |
| M17 | Controller không ghi `CLOSER_CHANGE_BEFORE_CHECKIN` | Đỏ (2) |
| X2 | `access.denied.after` thêm khóa chứa chữ đã gõ | Xanh: **tương đương**, allowlist `operation` bỏ khóa đó trước khi ghi |
| X2b | Chữ đã gõ vào `access.denied.after.fields` (khóa có trong allowlist) | Đỏ (3) |
| X7 | Đọc `closerChangeReason` và `f.done()` trước kiểm quyền (422 trước 403) | Đỏ (15) |
| X1 | Kiểm hoa hồng `payable`/`paid` (409) đặt trước kiểm quyền | **Xanh – sống** → 154-02 |
| M2 | Sau nhận phòng cho MGR+ | Đỏ (15) |
| M11 | Trước nhận phòng cho FD+ | Đỏ (1) |
| M18 | `checked_out` nhận mọi trường khi có đổi người chốt | Đỏ (1) |

M14–M18, S1, S2 trùng tên với bảng của BE-H. SEC chạy lại độc lập và có cùng kết quả.

---

## 5. Thẻ feedback

### FB-R5-SEC-BE-154-01
- Mức độ: **Minor**. Không chặn gộp #154: #154 sửa đúng phạm vi thẻ 123-01, và đường này có từ trước. Làm trong v1.0.5 nếu tiện (PR nhỏ), không thì v1.0.6 B-KYTHUAT.
- Người nhận: BE-H (hoặc BE phụ trách `registration`; ORC chọn)
- Vị trí:
  - `product/services/api/src/modules/registration/internal/registration.controller.ts` `addDocument`, dòng 227 @ `279b5492`: `this.crypto.keyedHash('idempotency', canonicalJson(data))`;
  - `product/services/api/src/shared/http/request-hash.ts` `canonicalJson` (đệ quy, chưa giới hạn; `bodyTooDeep` chỉ được gọi trong `requestHash`).
- Vấn đề:
  - `addGuestDocument` đọc phần `data` của multipart (tới 64 KB, `MAX_TEXT_PART`) bằng `JSON.parse`. `validateDocumentInput` chỉ đọc các khóa đã biết, nên một khóa lạ lồng sâu vẫn qua.
  - Sau đó controller gọi `canonicalJson(data)` **trực tiếp**, không qua `requestHash`, để băm ngữ nghĩa cho idempotency. Hàm đệ quy ném `RangeError` → **500**.
  - Probe P5: FD trên thiết bị tin cậy gửi các trường giả hợp lệ, cộng `"x"` lồng 10.000 tầng (khoảng 20 KB) → 500 `INTERNAL_ERROR`. Kết quả như nhau khi mã đăng ký là UUID ngẫu nhiên, vì hash được tính trước khi tra bản đăng ký.
  - Đo được: `canonicalJson` ném từ khoảng 3.000 tầng (6 KB).
  - Thẻ 123-01 của SEC liệt kê nơi gọi `requestHash` mà sót nơi gọi `canonicalJson` trực tiếp này.
- Vì sao quan trọng:
  - Cùng loại với 123-01: nhân viên đã đăng nhập tạo được lỗi 500 hàng loạt, làm nhiễu cảnh báo lỗi của OPS.
  - Không lộ dữ liệu: log chỉ có `RangeError` kèm `requestId`, không có trường giấy tờ. Không sai tiền.
- Đề xuất sửa:
  1. Đưa kiểm độ sâu vào **chính** `canonicalJson`: hàm xuất ra kiểm `bodyTooDeep` một lần rồi gọi hàm đệ quy nội bộ. Quá sâu thì ném `problem('VALIDATION_FAILED', { detail: 'Request body nested too deep' })`. Như vậy `requestHash` và mọi nơi gọi trực tiếp đều được che, hôm nay và về sau.

     Cách khác: trong `addDocument`, gọi `bodyTooDeep(data)` ngay sau `JSON.parse` → 422 `field: data`.
  2. Test HTTP: `addGuestDocument` với `data` lồng 10.000 tầng → 422, không ghi bản ghi giấy tờ, không lưu tệp.
  3. Nên có: một test quét `src` tìm `canonicalJson(` ngoài `request-hash.ts`. Nơi gọi mới phải có trong danh sách đã duyệt.
- Trạng thái: Open

### FB-R5-SEC-BE-154-02
- Mức độ: **Minor**. Không chặn gộp. Rẻ nhất là một commit chỉ thêm test vào #154 trước khi gộp (SEC chỉ cần đọc lại ngắn), hoặc một PR test riêng ngay sau khi gộp. Muộn nhất: cùng PR luồng chi hoa hồng (US-089), hoặc PR đầu tiên sửa `update()` hay `syncCommissionOnly`.
- Người nhận: BE-H
- Vị trí: `product/services/api/test/integration/v5-30-closer-change.test.ts`, ca "a commission already payable → 409 INVALID_TRANSITION" (chỉ chạy với OWN). Phía mã: kiểm quyền trong `reservations.service.ts` `update()`, nhánh 409 trong `folio.service.ts` `syncCommissionOnly`.
- Vấn đề:
  - Thứ tự hôm nay đúng về cấu trúc: 403 ném trong `update()` trước khi gọi `money.closerChanged`. Probe P1 xác nhận.
  - Nhưng **không ca nào** cho một vai dưới OWN chạm vào đơn có hoa hồng `payable`/`paid`.
  - Đột biến X1 của SEC (đặt kiểm `payable`/`paid` vào `update()` trước kiểm quyền) → 18/18 ca vẫn xanh. Bảng đột biến của BE-H không có đột biến nào đảo thứ tự này.
- Vì sao quan trọng:
  - Hợp đồng 1i ghi thứ tự 403 → 422 → 409 để "vai bị từ chối không dò được … trạng thái hoa hồng của người khác". `currentState` = `payable`/`paid` thuộc lớp "Hoa hồng – của người khác" (FD/FDL: K).
  - v1.0.5 chưa có luồng chi, nên nhánh này chưa tới được. Khi có luồng chi (US-089), hoặc khi có người sửa `update()`, thứ tự có thể bị đảo mà CI không báo.
- Đề xuất sửa:
  - Trong ca `payable`, trước lệnh của OWN: MGR, FDL, FD PATCH `closerUserId` (+ lý do) trên Y → 403 `FORBIDDEN_ACTION`, thân **không** có `currentState`, `access.denied` +3, người chốt và hoa hồng không đổi.
  - Đây đúng là probe P1, đã qua trên `279b5492`. Chỉ cần thêm test, không sửa mã.
  - Thêm X1 vào bảng đột biến của PR.
- Trạng thái: Open

### FB-R5-SEC-BE-154-03
- Mức độ: Suggestion. Làm ở lần sửa `update()` kế tiếp.
- Người nhận: BE-H
- Vị trí: `reservations.service.ts` `update()`, dòng 1389–1460 @ `279b5492`. Thứ tự hôm nay: `editable` → các nhánh `roomReturnRecorded` / `roomDisclosedToGuest` / `doorAccessHandedOver` → kiểm quyền người chốt.
- Vấn đề:
  - FD gửi `closerUserId` cùng `roomDisclosedToGuest: true` trên đơn đang ở → 409 từ nhánh `roomDisclosedToGuest`. Lần thử đổi người chốt trái quyền không để lại `access.denied` (probe P2 (i)).
  - Hai nhánh kia (`roomReturnRecorded`, `doorAccessHandedOver`) **ghi** vào đơn và audit trước khi tới 403. Probe P2 (ii): `doorAccessHandedOver` ghi giờ giao mã cửa, rồi 403 rollback xóa đi. Kết quả cuối đúng, nhưng đó là việc ghi thừa, và với `roomReturnRecorded` thì hook chuyển phòng cũng chạy trước 403.
  - Ca `checked_out` có trường khác → 409 là đúng chữ hợp đồng 1i, SEC không đề nghị đổi.
- Vì sao quan trọng: nhật ký từ chối đủ hơn khi thân lệnh gộp nhiều trường. Không đổi được gì, không lộ gì: 409 chỉ cho biết trạng thái đơn, FD vốn đọc được. Mức thấp.
- Đề xuất sửa: chuyển khối kiểm quyền người chốt lên ngay sau `if (!editable) throw this.invalid(row)`, trước các nhánh cờ. Hợp đồng vẫn giữ: `checked_out` có trường khác vẫn 409; 403 vẫn trước 422 và 409 hoa hồng. Thêm một ca: FD `closerUserId` + `roomDisclosedToGuest` trên đơn đang ở → 403 + một `access.denied`.
- Trạng thái: Open

---

## 6. Khi nào SEC đọc lại

Commit gộp `main` của BE-H sau khi #149 gộp (đã có: `4e81c3be`, remerge-diff rỗng, xem phần Đối tượng). Luật cho mọi lần gộp `main` tiếp theo:
- `git show --remerge-diff <merge>` rỗng: không cần đọc lại.
- Không rỗng mà chạm một trong các chỗ sau: SEC đọc lại phần chênh.
  - `reservations.service.ts` `update()`;
  - `reservations.controller.ts` `updateReservation`;
  - `audit/public/use-case-denial.ts`;
  - `reservations/audit-entities.ts`, `audit/public/audit-fields.ts` (`operation`);
  - `audit/public/audit-visibility.ts`, `folio/audit-entities.ts` (từ #149);
  - `shared/http/request-hash.ts`, `auth.guard.ts` `hasCompletedKey`;
  - `folio.service.ts` `syncCommissionOnly`, `tryEarnCommissions`, `ensureCommission`.
- Commit chỉ thêm test theo 154-02: SEC đọc nhanh, không cần chạy lại toàn bộ.

## 7. Điểm làm tốt

- 1H-01 sửa đúng cả hai nửa: lý do vào cột `reason`, allowlist chỉ thêm id. Có test khóa luôn allowlist (`has('reason') === false`), nên lần sửa sau không lặng lẽ mở lại được.
- `bodyTooDeep` duyệt bằng ngăn xếp và chạy trước mọi hàm đệ quy. Guard nuốt **mọi** lỗi của `requestHash`, không chỉ lỗi độ sâu (test có getter ném lỗi). Test tích hợp gửi thân dạng chữ, vì `JSON.stringify` của chính client test sẽ tràn trước.
- Bảng 30 đột biến của BE-H gắn với từng thẻ, kể cả thẻ của SEC. SEC chạy lại các đột biến trùng tên và có cùng kết quả.

## 8. Phạm vi và giới hạn

- SEC không review phần nghiệp vụ: cơ sở tính hoa hồng sau B16 hay sau xóa nợ, `recognized_at`, luật đạt B18, DOM 1H-04, DOM 110-03. Các phần đó thuộc DOM (đã duyệt) và ARC.
- SEC không chạy E2E smoke. ORC kiểm CI trên SHA cuối.
- SEC không approve hay gộp trên GitHub, không đẩy gì lên `r5-h1c`.

---

## 9. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – review BE-H PR #154 (r5-h1c, V5-30 bổ sung 1h) @ 279b5492: DUYỆT CÓ ĐIỀU KIỆN; phủ cả 4e81c3be (chỉ gộp main @ c058c5f0 có #149 c2d5588d, #153, #151; remerge-diff rỗng; SEC chạy lại 68/68 ca liên quan + probe P1/P4 ở 4e81c3be), ở đó cả hai điều kiện đã đạt nên gộp được khi CI xanh trên đúng SHA.** Điều kiện chỉ về thứ tự gộp: (1) #154 gộp sau #149 – probe P4: thiếu #149 thì FD/FDL đọc ratePct/baseVnd/commissionVnd của commission.voided/projected mới ở lịch sử đơn, có #149 thì không (gộp thử 80f2d239, không xung đột); (2) commit gộp main sau đó remerge-diff rỗng, nếu không SEC đọc lại phần chạm update()/use-case-denial/audit allowlist/audit-visibility/request-hash/syncCommissionOnly. Đạt: SEC 1H-01 (lý do ở cột reason đã làm sạch, after = {closerUserId}, allowlist không có reason); 1H-03 ý 1 (access.denied cả hai nhánh, after = {operationId, roles}, reason là hằng); thứ tự 403 → 422 → 409 đúng trong mã; checked_out chỉ nhận người chốt + lý do (BE 1H-01), trường khác 409 không ghi gì; SEC 123-01 cho mọi nơi gọi requestHash (MAX_BODY_DEPTH 32, duyệt bằng ngăn xếp, 422; guard nuốt lỗi → 403 + access.denied); G3 đạt (chỉ test_rate_short, applyPct); không PII trong audit hay dòng từ chối. SEC chạy 55/55 test của PR; gộp thử với #149: tsc sạch, toàn bộ API Vitest xanh (217 tệp, 5165 ca); 15 đột biến (13 đỏ, X2 tương đương nhờ allowlist operation, X1 sống). Thẻ: 154-01 Minor (addGuestDocument gọi canonicalJson trực tiếp: data lồng 10.000 tầng → 500; đưa kiểm độ sâu vào canonicalJson); 154-02 Minor (thêm test vai dưới OWN trên hoa hồng payable → 403 không currentState; đột biến X1 sống); 154-03 Suggestion (kiểm quyền người chốt trước các nhánh cờ để thân gộp cũng ghi access.denied). Đóng 1H-01 và 123-01 khi gộp; 1H-03 còn ý 3 (rbac-matrix, 0.3.14 (j)). Rủi ro Low giữ chấp nhận: MGR hoàn tác nhận phòng cùng ngày rồi đổi người chốt (có lý do và audit). Không ESC, không số hoa hồng | SEC | rounds/round-05/reviews/SEC-on-be-h-pr-154.md |`
