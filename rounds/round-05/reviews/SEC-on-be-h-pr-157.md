# SEC – Review PR #157 (BE-H `r5-h1d`: thẻ review #154 + ARC 149-01) @ `82052ad2`

Round 5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD lúc đọc | Gốc | Phần của PR | CI lúc đọc |
|---|---|---|---|---|---|
| #157 | `r5-h1d` | **`82052ad2`** | Xếp trên `4e81c3be` (head của #154). #154 đã gộp thành `fe70d0c0`, cha thứ hai là `4e81c3be` | 5 commit, không có commit gộp. 8 tệp, +342 −54: `request-hash.ts`, `reservations.service.ts`, `folio.service.ts`, `audit-log.controller.ts` và 4 tệp test | gitleaks, confidential paths, OpenAPI lint, API contract (RBAC `--strict`), no test endpoints: xanh. format · lint · audit · test · build, landing, shellcheck: đang chạy |

Các commit:

| Commit | Thẻ | SEC xét |
|---|---|---|
| `c01c9ca8` | ARC 154-01, **SEC 154-02**, DOM 154-02 (chỉ test) | Đầy đủ (mục 2) |
| `3473efd6` | DOM 154-01: dòng `earned` bị hủy giữ `recognized_at` | Để biết (mục 5) |
| `3d213a2c` | **SEC 154-01**: kiểm độ sâu trong `canonicalJson` | Đầy đủ (mục 1) |
| `ae0c4a85` | ARC 149-01: lưới quét `audit_event`, `seesFullAudit` | Phần bảo mật (mục 4) |
| `82052ad2` | **SEC 154-03**: kiểm quyền người chốt trước các nhánh cờ | Đầy đủ (mục 3) |

Cách kiểm:
- Lấy `refs/pull/157/head` vào ref tạm, mở worktree riêng ở scratchpad. Không checkout vào bản làm việc chung, không gọi staging hay production.
- **DB dùng một lần:** `postgres:17-alpine`, chỉ nghe `127.0.0.1`, mật khẩu thử của CI. `02-roles.sh` thật, đủ migration bằng `ottimo_migrator`. Test chạy bằng `ottimo_app`.
- Đọc từng commit trên `4e81c3be..82052ad2`.
- **Chạy test:**
  - `tsc --noEmit` sạch;
  - 6 tệp liên quan: 80/80 qua. Gồm `v5-30-closer-change`, `registration-flow`, `request-hash-guard-units`, `audit-visibility-gate`, `audit-visibility-commission`, `write-roles-gate`;
  - toàn bộ API Vitest @ `82052ad2`: 218 tệp qua, 2 tệp bỏ qua; 5 177 ca qua.
- **Gộp thử với `main` @ `0b615843`** (đã có #154 và #148). `git` tự gộp được, không xung đột. Remerge-diff rỗng. Phần khác so với `main` đúng bằng 8 tệp, +342 −54 của PR. `tsc` sạch, 6 tệp liên quan 80/80. #148 sửa `reservations.service.ts` và `folio.service.ts`, nhưng ở các chỗ đọc `bankReference`, không ở `update()` hay `syncCommissionOnly`.
- **Chạy lại probe của #154:**
  - P1: hoa hồng `payable`;
  - P5: `addGuestDocument` với `data` lồng 10 000 tầng.
- **10 đột biến** (mục 6).
- Xóa worktree, ref tạm, container và tệp tạm khi xong.

Tệp này không có bí mật, tỷ lệ hay số tiền hoa hồng, hay dữ liệu khách. Họ tên và số giấy tờ trong probe là giá trị giả của test.

---

## 0. Kết luận

| PR | SHA | Kết luận | Gộp khi |
|---|---|---|---|
| #157 | **`82052ad2`** | **DUYỆT** | CI xanh trên đúng `82052ad2`. Nếu thêm commit gộp `main`: remerge-diff phải rỗng. Nếu không rỗng, SEC đọc lại phần chạm `update()`, `request-hash.ts` và lưới quét `audit_event` |

- Ba thẻ SEC của #154 đã làm đúng như SEC đề xuất. Mỗi thẻ có test, và đột biến ngược lại làm test đỏ:
  - **154-01**: probe HTTP nay ra **422**;
  - **154-02**: đột biến X1 nay **đỏ**;
  - **154-03**: thân lệnh gộp nay ra 403 kèm một `access.denied`.
- #154 đã gộp (`fe70d0c0`), nên điều kiện "gộp sau #154" đã đủ.

0 Blocker · 0 Major · 0 Minor · 1 Suggestion (157-01, lưới quét). ESC mới: **không**.

---

## 1. SEC 154-01: kiểm độ sâu trong `canonicalJson` (`3d213a2c`)

| Kiểm | Kết quả |
|---|---|
| Mã | `canonicalJson` (hàm xuất ra) gọi `bodyTooDeep` (duyệt bằng ngăn xếp, giới hạn 32 tầng) **trước**, rồi mới gọi hàm đệ quy nội bộ `canonical`. Quá sâu: `problem('VALIDATION_FAILED', { detail: 'Request body nested too deep' })`, đúng chữ SEC đề xuất. `requestHash` vẫn kiểm trước `withoutSecrets` (hàm này cũng đệ quy), rồi gọi `canonical`, nên một thân lệnh không bị duyệt hai lần. **Đạt** |
| Thứ tự trong `addGuestDocument` | Băm `canonicalJson(data)` nằm **trước** `normalizeImage` và `uow.run`. Thân quá sâu dừng trước khi xử lý ảnh, ghi bản ghi giấy tờ hay lưu tệp. **Đạt** |
| Probe P5 (HTTP) | FD, thiết bị tin cậy, các trường giả hợp lệ cộng `"x"` lồng 10 000 tầng. Mã đăng ký thật → **422** `VALIDATION_FAILED`, "nested too deep". UUID ngẫu nhiên → **422**. Ở #154, cả hai ca này ra 500. **Đạt** |
| Test của PR | `registration-flow`: 422, số `guest_document` và `document_image` không đổi. `request-hash-guard-units`: `canonicalJson` ở 33 tầng và 20 000 tầng → 422; ở 32 tầng → ra JSON; khóa vẫn sắp xếp, `undefined` vẫn bị bỏ. **Đạt** |
| Nơi gọi trực tiếp | Test quét `src`: chỉ `registration.controller.ts` và `request-hash.ts` gọi `canonicalJson(`. Kiểm độ sâu đã nằm trong hàm, nên một nơi gọi mới vẫn được che. Test chỉ bắt người thêm nơi gọi phải ghi tên nó vào danh sách. **Đạt** |
| Log | Lỗi 422 là lỗi nghiệp vụ, không ghi `RangeError`, không ghi trường giấy tờ | **Đạt** |

## 2. SEC 154-02: vai dưới OWN trên hoa hồng `payable` (`c01c9ca8`)

| Kiểm | Kết quả |
|---|---|
| Test | Trong ca `payable`, **trước** lệnh của OWN: MGR, FDL, FD PATCH `closerUserId` kèm lý do trên Y. Cả ba nhận 403 `FORBIDDEN_ACTION`, thân **không có** `currentState`. `access.denied` tăng đúng 3. Người chốt và các dòng hoa hồng không đổi. **Đạt**, đúng đề xuất |
| Đột biến X1 (kiểm `payable`/`paid` đặt trước kiểm quyền) | Ở #154: 18/18 ca xanh. Nay: **đỏ**. **Đạt** |
| Probe P1 chạy lại | MGR, FDL, FD → 403 "closer change after check-in needs OWN", không `currentState` | **Đạt** |

Các test khác trong commit này (`recognized_at` = giờ OWN sửa; thân gộp người chốt + số người lớn hủy với `closer_changed` / `closer_corrected`; 1H-04 chỉ đếm người hưởng của chính đơn) thuộc ARC và DOM. SEC đọc: không có test nào nới quyền hay in thêm trường. Ca 1H-04 tạo tiền cọc bằng cách gọi thẳng `PaymentService` với sale làm người ghi. Đó là dựng dữ liệu trong test, không phải đường API.

## 3. SEC 154-03: kiểm quyền người chốt trước các nhánh cờ (`82052ad2`)

| Kiểm | Kết quả |
|---|---|
| Mã | Khối kiểm quyền chuyển nguyên văn lên ngay sau `if (!editable) throw this.invalid(row)`, trước `roomReturnRecorded` / `roomDisclosedToGuest` / `doorAccessHandedOver`. Không đổi điều kiện nào: sau xác nhận cần MGR+, sau nhận phòng cần OWN, `auditReason` giữ nguyên. **Đạt** |
| Hợp đồng 1i giữ nguyên | `checked_out` có trường khác vẫn 409 (ở `editable`, như SEC đã đồng ý ở #154). 403 vẫn trước các 422 riêng của người chốt (`closerUserId` `NOT_IN_LIST`, `closerChangeReason`) và trước 409 của hoa hồng đang chi. **Đạt** |
| Test của PR | Đơn đang ở, FD gửi `closerUserId` cùng một trong ba cờ. Kết quả: 403 cho cả ba lần, `access.denied` tăng đúng 3. Các giá trị sau **không đổi**: `version`, người chốt, `room_disclosed_to_guest`, `door_access_handed_over_at`, số dòng audit của đơn, các dòng hoa hồng. Nhánh cửa (lẽ ra ghi giờ giao mã) không ghi. Hook chuyển phòng không chạy trước 403. **Đạt** |
| Đột biến C1 (đưa khối về chỗ cũ, sau các cờ) | **Đỏ** | 

Một điểm SEC nhận, không thẻ (như ở #154): các 422 về **hình dạng** thân lệnh vẫn trả trước 403. Ví dụ: `adults` ngoài khoảng, cờ khác `true`. Chúng do `f.done()` ném, trước khi đọc đơn. Các 422 này chỉ nói thân lệnh viết sai, không nói gì về đơn, người chốt hay hoa hồng.

## 4. ARC 149-01: lưới quét `audit_event` và `seesFullAudit` (`ae0c4a85`), phần bảo mật

Lưới này là chốt chặn của thẻ SEC 131-01 (hoa hồng chỉ OWN/MGR đọc trong nhật ký). SEC xét xem nó có bắt được một nơi đọc mới không đi qua cổng.

| Kiểm | Kết quả |
|---|---|
| Mẫu đọc | Sau `FROM`, `JOIN` hoặc dấu phẩy; có `ONLY`, tên trong ngoặc kép, có schema. Bản phân vùng không tính (migration 0001 thu quyền của `ottimo_app`). **Đạt** |
| Bỏ chú thích | Dùng bộ phân tích TypeScript: chú thích nhắc tên bảng hay tên hàm cổng không được tính. Chuỗi SQL trong template giữ nguyên. **Đạt** |
| Ngoại lệ | Mỗi ngoại lệ ghi số lần đọc đã review. Thêm một lần đọc trong tệp ngoại lệ thì test đỏ. **Đạt** |
| `seesFullAudit` | `FULL_AUDIT_ROLES` = `owner`, `manager`, đúng hai vai controller dùng trước đây. Người đọc đủ nhật ký không đổi. **Đạt** |
| Đột biến | A1 (đọc kiểu dấu phẩy ở tệp khác): đỏ. A2 (`"public"."audit_event"`): đỏ. A3 (lần đọc thứ hai trong tệp ngoại lệ): đỏ. A4 (chỉ có trong chú thích): xanh, đúng ý, không báo nhầm. A5 (thêm FDL vào `FULL_AUDIT_ROLES`): đỏ, 3 ca | **Đạt** |

Giới hạn còn lại:
- Lưới chưa bắt `TABLE audit_event` (câu đọc cả bảng của PostgreSQL), `DELETE … USING audit_event`, tên bảng ghép động và query builder.
- SEC tìm trong `src` (trừ migration): hôm nay không có chỗ nào như vậy. Chỉ có câu `INSERT INTO audit_event` của `audit.service.ts`, và danh sách tên bảng của job phân vùng. Không có `from(auditEvent)` của drizzle.
- Xem thẻ 157-01.

## 5. DOM 154-01: dòng `earned` bị hủy giữ `recognized_at` (`3473efd6`), để biết

- `syncCommissionOnly` hủy dòng đạt của người cũ mà không xóa `recognized_at`, giống `voidCommissions` (B10/B11).
- Phía bảo mật: không mở thêm gì. Dòng hủy đã có từ trước. Nó vẫn chỉ hiện cho đúng những người đã thấy nó; chỉ thêm một ngày:
  - nhật ký hoa hồng chỉ OWN/MGR đọc (SEC 131-01);
  - ở `listCommissions`, sale/CTV chỉ thấy dòng của chính mình (`isOwnScope`), như trước.
- `recognized_at` là một ngày, không có số tiền hay tỷ lệ.
- Đột biến V1 (xóa `recognized_at` lại) → đỏ.

## 6. Đột biến

Mỗi đột biến sửa một chỗ trong worktree tạm, chạy các tệp test liên quan, rồi trả mã về như cũ.

| # | Đột biến | Test chạy | Kết quả |
|---|---|---|---|
| D1 | `canonicalJson` bỏ kiểm độ sâu | `request-hash-guard-units`, `registration-flow` | **Đỏ** (2 ca) |
| D2 | `canonicalJson` nới lên 64 tầng | như trên | **Đỏ** (1) |
| C1 | Khối kiểm quyền người chốt về sau các nhánh cờ | `v5-30-closer-change` | **Đỏ** (1) |
| X1 | Kiểm `payable`/`paid` đặt trước kiểm quyền | như trên | **Đỏ** (1). Ở #154 đột biến này sống |
| V1 | Hủy dòng đạt xóa `recognized_at` | như trên | **Đỏ** (1) |
| A1 | Thêm một lần đọc kiểu dấu phẩy ở tệp không có cổng | `audit-visibility-gate`, `audit-visibility-commission` | **Đỏ** (1) |
| A2 | Thêm một lần đọc `"public"."audit_event"` | như trên | **Đỏ** (1) |
| A3 | Thêm một lần đọc trong tệp ngoại lệ | như trên | **Đỏ** (1) |
| A4 | Chỉ thêm một chú thích nhắc bảng | như trên | Xanh (đúng: không báo nhầm) |
| A5 | Thêm FDL vào `FULL_AUDIT_ROLES` | như trên | **Đỏ** (3) |

---

## 7. Thẻ

### FB-R5-SEC-BE-157-01
- Mức độ: Suggestion. Không chặn gộp. Làm ở lần sửa lưới quét kế tiếp, hoặc trong PR đầu tiên thêm một nơi đọc `audit_event`.
- Người nhận: BE-H (ARC xem cùng thẻ ARC 149-01)
- Vị trí: `product/services/api/test/audit-visibility-gate.test.ts`, hằng `READ`.
- Vấn đề: lưới chưa nhận ra hai cách đọc bảng hợp lệ của PostgreSQL: `TABLE audit_event` và `DELETE … USING audit_event`. (`UPDATE … FROM audit_event` có `FROM`, nên đã bắt được.) Hôm nay `src` không có chỗ nào như vậy.
- Vì sao quan trọng: `ottimo_app` đọc được `audit_event` (RLS theo cơ sở), nên cơ sở dữ liệu không chặn. Lưới là chốt duy nhất bắt một nơi đọc mới bỏ qua `auditVisibleWhere` / `redactAuditFields`, tức để FD/FDL thấy dòng hoa hồng (SEC 131-01).
- Đề xuất sửa: thêm `TABLE` và `USING` vào nhóm từ khóa trước tên bảng:
  ```
  /(?:\b(?:FROM|JOIN|USING|TABLE)\s+|,\s*)(?:ONLY\s+)?(?:"?\w+"?\.)?"?audit_event\b/gi
  ```
  Thêm hai mẫu vào ca S5–S8.
  - SEC đã thử biểu thức này trên `src` (trừ migration): không tệp nào đổi số lần đọc, nên lưới vẫn xanh.
  - Hai mẫu `TABLE audit_event` và `DELETE FROM x USING audit_event e` ra 1.
  - Các mẫu "không phải đọc" vẫn ra 0: `INSERT INTO audit_event`, `CREATE INDEX x ON audit_event (a), audit_event_property_actor_idx`, `ALTER TABLE audit_event_p202611`.
  - Tên bảng ghép động và query builder thì lưới không bắt được. Ghi một câu vào chú thích đầu tệp: "không ghép tên `audit_event` động; đọc nhật ký qua `audit-visibility`".
- Trạng thái: Open

---

## 8. Trạng thái thẻ cũ

| Thẻ | Trạng thái |
|---|---|
| FB-R5-SEC-BE-154-01 (Minor, `canonicalJson` gọi trực tiếp → 500) | **Done** @ `3d213a2c`. **Closed** khi #157 gộp |
| FB-R5-SEC-BE-154-02 (Minor, test vai dưới OWN trên `payable`) | **Done** @ `c01c9ca8`. **Closed** khi #157 gộp |
| FB-R5-SEC-BE-154-03 (Suggestion, kiểm quyền trước các nhánh cờ) | **Done** @ `82052ad2`. **Closed** khi #157 gộp |
| FB-R5-SEC-BE-123-01, phần nơi gọi `canonicalJson` trực tiếp | **Closed** khi #157 gộp |
| FB-R5-ARC-BE-149-01 (thẻ ARC, lưới quét) | Phía SEC: đạt (mục 4). ARC đóng thẻ |

## 9. Điểm làm tốt

- Mỗi thẻ có một commit riêng, thông điệp nêu đúng thẻ. Mỗi sửa đổi có test bắt chiều ngược lại.
- Sửa 154-01 ở chính hàm xuất ra, không vá riêng `addGuestDocument`. Có thêm test liệt kê nơi gọi trực tiếp.
- Ca 154-03 kiểm cả ba cờ và kiểm trạng thái đơn trước/sau, không chỉ kiểm mã trả về.

## 10. Giới hạn

- Trên bản gộp thử với `main`, SEC chỉ chạy 6 tệp liên quan, không chạy toàn bộ bộ test. Toàn bộ bộ test SEC chạy trên `82052ad2`. CI chạy toàn bộ trên bản gộp của GitHub.
- SEC không xét đúng sai nghiệp vụ của `recognized_at` (DOM 154-01, 154-02) hay phần ARC 154-01.
- SEC không chạy gì trên staging hay production, không approve hay gộp trên GitHub.

---

## 11. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – review BE-H PR #157 (r5-h1d, thẻ review #154 + ARC 149-01) @ 82052ad2: DUYỆT; gộp khi CI xanh trên đúng SHA (commit gộp main thêm sau đó: remerge-diff rỗng, không thì SEC đọc lại update()/request-hash/lưới quét).** Xếp trên 4e81c3be, #154 đã gộp fe70d0c0; gộp thử với main 0b615843 (có #148): không xung đột, remerge-diff rỗng, phần khác đúng 8 tệp +342 −54, 6 tệp liên quan 80/80. SEC 154-01 (3d213a2c): kiểm độ sâu nằm trong canonicalJson, trước xử lý ảnh và unit of work; probe HTTP addGuestDocument data lồng 10.000 tầng → 422 (mã đăng ký thật và UUID ngẫu nhiên; ở #154 là 500), không ghi giấy tờ hay ảnh; nơi gọi trực tiếp chỉ registration.controller và request-hash. SEC 154-02 (c01c9ca8): MGR/FDL/FD trên hoa hồng payable → 403 không currentState, access.denied +3; đột biến X1 nay đỏ. SEC 154-03 (82052ad2): kiểm quyền người chốt ngay sau editable, trước ba cờ; FD người chốt + cờ trên đơn đang ở → 403 + một access.denied mỗi lần, không ghi cờ, không chạy hook; checked_out trường khác vẫn 409. ARC 149-01 (ae0c4a85): lưới bắt dấu phẩy, ONLY, ngoặc kép, schema, bỏ chú thích bằng bộ phân tích TS, đếm lần đọc của ngoại lệ; seesFullAudit = owner, manager như cũ. DOM 154-01 (3473efd6): dòng hủy giữ recognized_at, không mở thêm gì. SEC chạy toàn bộ API Vitest @ 82052ad2: 218 tệp qua, 5177 ca; tsc sạch; 10 đột biến (9 đỏ, A4 chỉ chú thích xanh đúng ý). Thẻ mới: 157-01 Suggestion (lưới quét thêm TABLE và USING). Đóng 154-01, 154-02, 154-03 và phần nơi gọi trực tiếp của 123-01 khi #157 gộp. Không ESC, không số hoa hồng | SEC | rounds/round-05/reviews/SEC-on-be-h-pr-157.md |`
