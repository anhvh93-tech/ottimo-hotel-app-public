# ARC review PR #157 (BE-H) – `r5-h1d`: các thẻ review của #154 và thẻ ARC 149-01

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR: [#157](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/157), nhánh `r5-h1d`, draft, `base = main`, head **`82052ad2`**.
  - Nhánh cắt từ `4e81c3be` (head của #154). ARC chỉ review **5 commit sau `4e81c3be`**: `c01c9ca8`, `3473efd6`, `3d213a2c`, `ae0c4a85`, `82052ad2`.
  - Quy mô phần chênh: 8 tệp, +342/−54. Có 4 tệp `src` và 4 tệp test. Không có migration, không sửa `openapi.yaml`, không sửa tệp sinh.
- Đối chiếu:
  - review của ARC: `ARC-on-be-h-pr-154.md` (thẻ 154-01, mục 8, 8.1, 9) và `ARC-on-be-h-pr-149.md` (thẻ 149-01);
  - thẻ của vai khác: `SEC-on-be-h-pr-154.md` (154-01/02/03) và `DOM-on-be-h-pr-154.md` (154-01/02);
  - hợp đồng 0.3.13, bổ sung 1h/1i: bảng 1.29, 1.30 và thứ tự lỗi 403 → 422 → 409;
  - `DOM-on-be-h-pr-157.md`: đã lên `main`. ARC chỉ đọc sau khi tự kiểm xong.
- Cách kiểm:
  - Đọc mã trên ref riêng `refs/scratch/pr157`, `pr154`, `pr152`, trong một worktree tạm ở scratchpad. Không checkout nhánh trong thư mục chính, không push vào nhánh PR.
  - PostgreSQL 17 riêng: container `arc-157-pg`, chỉ nghe `127.0.0.1`, dùng mật khẩu CI công khai của repo.
  - Container, worktree và ba ref tạm đã xóa sau review.
  - Không gọi staging hay production. Tệp này không có bí mật, IP máy chủ, tỷ lệ hay số tiền hoa hồng, dữ liệu khách. Ví dụ chỉ dùng tên vai (`sal`, `sal2`) như test.
- CI của `82052ad2` lúc viết: 7 job xanh (landing, shellcheck, confidential paths, no test endpoints, Redocly, contract RBAC `--strict`, gitleaks). Job `format · lint · audit · test · build` đang chạy. E2E smoke chưa bắt đầu.
- CI của #154 @ `4e81c3be` lúc viết: **xanh hết, kể cả E2E smoke**. Vậy điều kiện (2) của ARC cho #154 đã đạt.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Điều kiện gộp | Thẻ ARC |
|---|---|---|---|
| **#157 @ `82052ad2`** (5 commit sau `4e81c3be`) | **DUYỆT CÓ ĐIỀU KIỆN** | (1) Gộp **sau #154**: #152 → #154 → #157. (2) CI xanh trên head cuối, **kể cả E2E smoke** | 157-01 (Suggestion) |

- Năm commit làm đúng các thẻ đã giao, không có gì thừa (mục 1).
  - ARC 154-01 (a)(b)(c): ba ca mới, đúng các probe P1, P2, P4 của ARC.
  - DOM 154-01: dòng `void` giữ ngày, theo quyết định của ARC.
  - DOM 154-02: ghim giờ OWN sửa.
  - SEC 154-01: kiểm độ sâu nằm ở `canonicalJson`, theo cách ARC chọn.
  - ARC 149-01: đủ 4 điểm.
  - SEC 154-03: kiểm quyền người chốt đứng trước các cờ.
- Không có migration. Thứ tự khóa không đổi. Thứ tự 403 → 422 → 409 của 1i vẫn đúng. 403 nay đến sớm hơn nữa, nên trước khi rollback không còn lần ghi hay hook nào (mục 2, 3).
- Gộp thử `main` @ `49eaa33f` + #152 @ `a077fc44` + #157 @ `82052ad2`. Lần gộp này mang theo #154 @ `4e81c3be`.
  - Git tự gộp, không xung đột. `tsc --noEmit` sạch. Prettier và ESLint sạch trên 8 tệp.
  - Toàn bộ API: **218 tệp qua, 2 tự bỏ qua; 5182 ca qua, 19 bỏ qua, 1 todo, 0 hỏng**. Khớp số BE-H báo trên `38b1f476` (mục 4).
- Đột biến của ARC: 11 đột biến, **10 đỏ**.
  - 3 đột biến còn xanh ở #154 (R1, R2, R4) nay đều đỏ.
  - Đột biến còn xanh (A10) chỉ sửa chính test quét, không sửa mã `src`.
  - 3 probe cho thấy regex quét vẫn sót ba cách viết SQL hợp lệ mà repo chưa dùng. Đây là thẻ 157-01, mức Suggestion, không chặn gộp (mục 5, 6).
- Thẻ đóng khi #157 gộp: **ARC 154-01**, **ARC 149-01**. SEC và DOM tự đóng thẻ của mình. ARC đồng ý phần mã khớp lời SEC 154-01/02/03 và DOM 154-01/02.

---

## 1. Đối chiếu từng thẻ

| Thẻ | Commit | ARC kiểm gì | Kết quả |
|---|---|---|---|
| ARC 154-01 (a): sửa gộp người chốt + trường đổi giá | `c01c9ca8` | Ca mới: MGR gửi `{ closerUserId, adults }` trước ngày đến → `closer_changed`. OWN gửi `{ closerUserId, closerChangeReason, adults }` khi đơn đang ở → `closer_corrected`. Mỗi đơn đúng một dòng sống của người mới, không có `void` `resync`. Cả hai ca kiểm `adults` đã đổi, nên nhánh tính lại giá có chạy | Khớp. A2 (`closerChanged` dời xuống sau `resynced`) **đỏ** |
| ARC 154-01 (b): phạm vi 1H-04 theo từng đơn | `c01c9ca8` | `sal2` là người hưởng ở đơn khác, không ở đơn Q. `sal2` ghi một khoản cọc tiền mặt `pending` trên folio của Q. Sau B18, `sal` vẫn `earned`. Ca này kiểm cả tiền đề (`sal2` có dòng hoa hồng ở đơn khác) và trạng thái `pending` của khoản cọc | Khớp. A3 (bỏ `v.reservation_id = c.reservation_id`) **đỏ** |
| ARC 154-01 (c) = SEC 154-02: 403 trước 409 | `c01c9ca8` | Ca Y với hoa hồng `payable`: MGR, FDL, FD đổi người chốt → 403 `FORBIDDEN_ACTION`, không có `currentState`, `access.denied` tăng đúng 3. Người chốt và các dòng hoa hồng không đổi. Sau đó OWN vẫn nhận 409 | Khớp. ARC không chạy lại X1 của BE-H: hai lớp kiểm nằm ở hai module (quyền ở `update()`, 409 ở `syncCommissionOnly`), và ca này đọc đúng mã cùng thân lỗi |
| DOM 154-02: `recognized_at` = lúc OWN sửa | `c01c9ca8` | Ca X: dòng `earned` mới mang đúng 21/10 12:00, lúc OWN sửa. Không phải 11:00, giờ B18 | Khớp. A1 (người mới lấy `folio.settled_at`, tức R1 của ARC ở #154) **đỏ** |
| DOM 154-01: dòng `void` giữ `recognized_at` | `3473efd6` | Lệnh `void` của `syncCommissionOnly` (`folio.service.ts:1786`) nay giống `voidCommissions`. Ca X ghim cả hai ngày. ARC tìm lại trong `src`: chỉ `commissions.service.ts` đọc `recognized_at` để hiển thị, và nó lọc theo trạng thái. Không có ràng buộc DB nào đòi cột này rỗng. `unearnCommissions` vẫn xóa ngày, đúng | Khớp. A4 (thêm lại `recognized_at = NULL`) **đỏ** |
| SEC 154-01: kiểm độ sâu ở `canonicalJson` | `3d213a2c` | Chi tiết ở dòng 1.1 dưới bảng | Khớp. A5 (bỏ kiểm ở `canonicalJson`) **đỏ** 2 ca. A6 (bỏ kiểm sớm ở `requestHash`) **đỏ** 2 ca |
| ARC 149-01 (1)–(4): lưới quét `audit_event` | `ae0c4a85` | Chi tiết ở dòng 1.2 dưới bảng | Khớp đủ 4 điểm. A11 **đỏ**. Còn ba cách viết lọt → thẻ 157-01 |
| SEC 154-03: kiểm quyền người chốt trước các cờ | `82052ad2` | Chi tiết ở dòng 1.3 dưới bảng | Khớp. A7, A8, A9 **đỏ** |

1.1 SEC 154-01 (`3d213a2c`):
- `canonicalJson` được xuất ra (`request-hash.ts:43`) gọi `bodyTooDeep` trước, rồi mới gọi `canonical()` nội bộ. `requestHash` giữ kiểm sớm của mình (`:72`), vì `withoutSecrets` cũng đệ quy. Sau đó `requestHash` gọi thẳng `canonical()`, nên mỗi thân chỉ bị đi qua một lần để kiểm độ sâu.
- Trong `addGuestDocument`, lỗi 422 xảy ra trước `normalizeImage` và trước `uow.run`. Vì vậy không có giấy tờ, không có ảnh, không có bản ghi idempotency. Gửi lại cùng khóa thì nhận lại 422.
- Test quét liệt kê các nơi gọi trực tiếp: đúng hai tệp. `unit-of-work.ts` chỉ xuất lại hàm, không gọi.
- `public-rate.port.ts` có một hàm `canonical()` đệ quy riêng. Hàm này chỉ đi qua dữ liệu do máy chủ dựng (tham số giá và danh sách căn), không đi qua thân request. Nằm ngoài phạm vi thẻ.

1.2 ARC 149-01 (`ae0c4a85`):
- (1) Chú thích được bỏ bằng chính TypeScript parser. Chuỗi và template SQL giữ nguyên. Regex `READ` (`audit-visibility-gate.test.ts:67`) chặt hơn đề xuất của ARC ở hai chỗ: dấu phẩy không có khoảng trắng, và `"public"."audit_event"`.
- (2) `EXCEPTIONS` thành `{ reason, reads }` và phải bằng đúng số lần đọc.
- (3) `audit-log.controller.ts:164` dùng `seesFullAudit`. `FULL_AUDIT_ROLES` là `owner`, `manager`, nên hành vi không đổi.
- (4) Có ba ca trên chuỗi mẫu.
- Lọc trước bằng `/audit_event/i`, nên tệp viết `FROM AUDIT_EVENT` vẫn bị bắt (probe U1 đỏ, đúng).
- Trên `src` hiện tại vẫn ra đúng 5 tệp, mỗi tệp 1 lần đọc.

1.3 SEC 154-03 (`82052ad2`):
- Khối kiểm quyền dời lên ngay sau `if (!editable)` (`reservations.service.ts:1389`), trước `roomReturnRecorded`, `roomDisclosedToGuest`, `doorAccessHandedOver` (`:1411`).
- Giữa vị trí cũ và mới chỉ có ba khối cờ này. `closerChange` và `checkedIn` đã tính trước `editable`, nên khối kiểm cho cùng kết quả ở vị trí mới.
- Ca mới: FD gửi người chốt kèm từng cờ khi đơn đang ở → 403, `access.denied` tăng đúng 3. `version`, người chốt, cờ, giờ giao mã cửa, audit của đơn và hoa hồng đều không đổi.

---

## 2. Hợp đồng và migration

- Không migration, không đổi schema API. Ba thay đổi client có thể thấy, đều đúng chữ hợp đồng đang có:
  1. FD/FDL gửi người chốt kèm một cờ phòng/cửa khi đơn đang ở: trước là 409 và không có `access.denied`, nay là **403** và một `access.denied`. Đúng thứ tự 403 → 422 → 409 của 1i, nên không cần câu mới.
  2. `addGuestDocument` với `data` lồng sâu: trước là 500, nay là **422 `VALIDATION_FAILED`**. 422 đã có trong danh sách lỗi của thao tác này.
  3. Dòng hoa hồng `void` do đổi người chốt nay có thể mang `recognizedAt` trong `listCommissions`. Trường này vốn tùy chọn và đã có trên dòng `void` của B10/B11. FE-A không cần sửa. Màn **Hoa hồng** của OWN nên hiển thị ngày đó như với dòng `void` do hủy đơn.
- Thứ tự với lỗi dạng của thân không đổi. `f.done()` vẫn trả 422 trước khi tải đơn, ví dụ khi `doorAccessHandedOver: false`. Đây là câu 0.3.14 ARC đã nhận ở `ARC-on-be-h-pr-154.md` mục 9 ý 1.

## 3. Giao dịch và khóa

- Thứ tự khóa giữ nguyên: đơn (`FOR UPDATE`) → căn → folio → `commission` `FOR UPDATE`, như B18.
- SEC 154-03 làm 403 đến **trước** mọi lần ghi của nhánh cờ: `UPDATE reservation`, `audit.record`, hook `roomReturn`. Trước đây các lần ghi đó đã chạy rồi mới bị rollback cùng 403. Kết quả cuối giống nhau, nhưng nay ít việc thừa hơn trong giao dịch đang giữ khóa đơn.
- `3473efd6` bớt một cột trong lệnh `UPDATE` dưới cùng khóa. Không thêm câu truy vấn nào.

## 4. Gộp thử

- Cây gộp thử: `main` @ `49eaa33f` → gộp #152 @ `a077fc44` → gộp #157 @ `82052ad2`. Lần gộp #157 mang theo #154 @ `4e81c3be`.
  - Thứ tự này là thứ tự gộp thật (#147, #149 đã lên `main`).
  - Git tự gộp cả hai lần, không xung đột.
- `turbo build` các gói phụ thuộc rồi `tsc --noEmit` cho `@ottimo/api`: sạch.
- Vitest toàn bộ API trên PostgreSQL 17 mới: **218 tệp qua, 2 tự bỏ qua (220); 5182 ca qua, 19 bỏ qua, 1 todo, 0 hỏng**. Lần chạy này dùng database bootstrap mới tạo, nên không lặp lỗi môi trường của lần review #154.
- Bốn tệp test đổi, chạy riêng: 63 ca qua. Riêng `v5-30-closer-change` có 21 ca.
- Prettier `--check` và ESLint trên 8 tệp đổi: sạch.

## 5. Đột biến và probe của ARC

Mỗi đột biến sửa một chỗ trên cây gộp thử, chạy các tệp test liên quan, rồi trả mã về (`git checkout`). Cây sạch sau mỗi lần.

| Mã | Đột biến | Tệp test | Kết quả |
|---|---|---|---|
| A1 | Dòng `earned` mới lấy `folio.settled_at` (giờ B18) thay vì lúc sửa. Đây là R1 của ARC ở #154 | `v5-30` | **Đỏ** (2 ca, có ca X) |
| A2 | Dời `money.closerChanged` xuống sau khối `repriced`/`resynced` (R2 ở #154) | `v5-30` | **Đỏ** (ca ARC 154-01 (a)) |
| A3 | 1H-04 bỏ điều kiện "của chính đơn" trong truy vấn con người hưởng (R4 ở #154) | `v5-30` | **Đỏ** (ca ARC 154-01 (b)) |
| A4 | Lệnh `void` của `syncCommissionOnly` xóa lại `recognized_at` | `v5-30` | **Đỏ** (ca X) |
| A5 | `canonicalJson` bỏ kiểm độ sâu | `request-hash-guard-units`, `registration-flow` | **Đỏ** (2 ca: đơn vị, và `addGuestDocument` 422) |
| A6 | `requestHash` bỏ kiểm sớm, để `withoutSecrets` đệ quy trước | `request-hash-guard-units`, `registration-flow` | **Đỏ** (2 ca: `requestHash` 20.000 tầng, guard `hasCompletedKey`) |
| A7 | Trả cả khối kiểm quyền người chốt về sau ba cờ | `v5-30` | **Đỏ** (ca SEC 154-03) |
| A8 | Chỉ khối `roomReturnRecorded` đứng trước kiểm quyền | `v5-30` | **Đỏ** |
| A9 | Chỉ khối `roomDisclosedToGuest` đứng trước kiểm quyền | `v5-30` | **Đỏ** |
| A10 | Lọc trước của test quét phân biệt hoa thường (`/audit_event/` không có `i`) | `audit-visibility-gate` | Xanh. Đột biến này sửa chính test quét. Không ca mẫu nào chạy qua bước lọc trước, xem 157-01 ý 2 |
| A11 | Regex chỉ nhận dấu phẩy có khoảng trắng (`,\s+`) | `audit-visibility-gate` | **Đỏ** (ca S5 không khoảng trắng) |

Probe: ARC thêm tạm một tệp vào `src/modules/zz-arc-probe/`, chạy test quét, rồi xóa tệp.

| Mã | Nội dung tệp probe | Kết quả | Nghĩa |
|---|---|---|---|
| U1 | `` `SELECT e.before FROM AUDIT_EVENT e` `` | Đỏ | Đúng. PostgreSQL đổi tên không ngoặc về chữ thường, và lưới bắt được |
| U1 + A10 | như trên, lọc trước phân biệt hoa thường | Xanh | Bước lọc trước chưa có ca giữ |
| U3a | `` `DELETE FROM job_run j USING audit_event e … RETURNING e.before` `` | **Xanh** | Lọt: `USING` |
| U3b | `` `TABLE audit_event` `` | **Xanh** | Lọt: lệnh `TABLE` |
| U3c | `` `SELECT e.before FROM (audit_event e JOIN app_user u ON …)` `` | **Xanh** | Lọt: phép nối trong ngoặc |

- ARC đã chạy `EXPLAIN` cả ba câu U3 trên database thử. Cả ba là SQL hợp lệ. `ottimo_app` có quyền `SELECT` trên `audit_event`, nên các câu đó đọc được bảng.
- Hôm nay `src` không dùng cách viết nào trong ba cách trên. ARC đã chạy regex đề xuất ở 157-01 trên `src` của `main`: vẫn ra đúng 5 tệp, mỗi tệp 1 lần đọc.

## 6. Thẻ feedback ARC

### FB-R5-ARC-BE-157-01
- Mức độ: **Suggestion** (không chặn gộp; làm ở PR kế tiếp có sửa lưới quét, muộn nhất trước nơi đọc audit thứ ba của v1.0.6)
- Người sửa: BE-H
- Vị trí: `product/services/api/test/audit-visibility-gate.test.ts:67` (`READ`), `:84` (lọc trước)
- Vấn đề:
  1. Regex `READ` chưa bắt ba cách viết SQL hợp lệ có đọc `audit_event`: probe U3a–U3c ở mục 5 đều xanh.
     - `USING audit_event` trong `DELETE … USING` / `MERGE … USING`;
     - lệnh `TABLE audit_event`;
     - phép nối trong ngoặc `FROM (audit_event e JOIN …)`.
  2. Bước lọc trước `/audit_event/i` chưa có ca nào giữ: đột biến A10 xanh. Các ca mẫu S5–S8 gọi thẳng `count(sql, READ)`, không chạy qua chuỗi lọc trước → bỏ chú thích → đếm của test quét.
- Vì sao quan trọng:
  - Lưới quét là lời hứa của #149 mục 5.1 rằng nơi đọc audit thứ ba không lọt.
  - Một tệp mới chỉ dùng một trong ba cách viết trên sẽ không vào danh sách người đọc. Ô kiểm tra danh sách cũng không đỏ.
  - Rủi ro hôm nay thấp: repo chưa có cách viết nào như vậy. Nhưng người viết sau sẽ tin vào lưới này.
- Đề xuất sửa:
  1. Đổi `READ` thành `/(?:\b(?:FROM|JOIN|USING|TABLE)\s+|,\s*|\(\s*)(?:ONLY\s+)?(?:"?\w+"?\.)?"?audit_event\b/gi`.
     - ARC đã thử trên `src` của `main`: vẫn 5 tệp, mỗi tệp 1 lần đọc.
     - Không bắt `JOIN x USING (audit_event_id)`, `INSERT INTO audit_event`, hay phân vùng `audit_event_p202611`.
  2. Thêm U3a–U3c vào ca "mỗi chuỗi là một lần đọc".
  3. Tách chuỗi lọc trước → bỏ chú thích → đếm thành một hàm. Test quét và một ca mẫu cùng gọi hàm đó, với nguồn chứa `FROM AUDIT_EVENT`; ca mẫu phải ra 1.
- Trạng thái: Open

## 7. Trạng thái thẻ

| Thẻ | Trạng thái đề xuất |
|---|---|
| FB-R5-ARC-BE-154-01 (Minor) | **Đóng** khi #157 gộp: A1, A2, A3 đỏ, và ca 403 trước 409 có ở `c01c9ca8` |
| FB-R5-ARC-BE-149-01 (Minor) | **Đóng** khi #157 gộp: đủ 4 điểm. Phần còn hở chuyển sang 157-01 (Suggestion) |
| SEC 154-01/02/03, DOM 154-01/02 | Phần mã khớp lời ARC đã ghi ở `ARC-on-be-h-pr-154.md` mục 8, 8.1. SEC, DOM tự đóng thẻ của mình. DOM đã duyệt ở `DOM-on-be-h-pr-157.md` |

Việc 0.3.14 của ARC (`ARC-on-be-h-pr-154.md` mục 9) đổi như sau:
- Ý 3 (kiểm độ sâu ở `canonicalJson`) ghi được ngay khi #157 gộp.
- Ý 4 (`erd.md`, `commission.void_reason`) thêm một câu: "dòng `void` do đổi người chốt giữ `recognized_at`, như B10/B11".
- Ý 1 và 2 giữ nguyên.

## 8. Ghi chú cho ORC

- **Thứ tự gộp:** #152 → #154 → #157, bằng merge commit như các PR trước của BE-H.
  - #154 @ `4e81c3be` đã xanh CI, kể cả E2E smoke, nên đủ hai điều kiện của ARC khi #152 đã lên.
  - #157 chờ job test/build và E2E smoke của `82052ad2`.
- Nếu BE-H thêm commit vào `r5-h1d` sau `82052ad2` (ví dụ kết quả chạy lại bộ đột biến của r5-h1c mà PR hứa cập nhật), ARC chỉ cần đọc phần chênh.
- Tài nguyên tạm của ARC đã xóa: container `arc-157-pg`, worktree `wt157t`, các ref `refs/scratch/pr152`, `pr154`, `pr157`.
  - ARC tự tạo ba ref này bằng `git fetch`. Nếu vai khác cũng dùng đúng tên đó, chỉ cần fetch lại.

## 9. Điểm làm tốt

- Mỗi thẻ một commit, mỗi commit có đột biến riêng. Bảng đột biến của PR khớp với kết quả ARC chạy lại.
- SEC 154-03 được làm bằng cách dời một khối mã, không thêm luật. Ca test kiểm cả ba cờ và đọc lại toàn bộ trạng thái sau 403.
- Ca 1H-04 (b) kiểm cả tiền đề: `sal2` có hoa hồng ở đơn khác. Nhờ vậy ca này không thể xanh vì dữ liệu sai.
- Lưới quét bỏ chú thích bằng parser thật, không bằng regex. Ca mẫu có cả `//` trong URL và `/* */` bên trong SQL.

## 10. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC DUYỆT CÓ ĐIỀU KIỆN BE-H #157 (`r5-h1d`) @ `82052ad2` (5 commit sau `4e81c3be`). Điều kiện gộp: sau #154 (#152 → #154 → #157); CI xanh trên head cuối, kể cả E2E smoke. Đúng thẻ: ARC 154-01 (a) sửa gộp → `closer_changed`/`closer_corrected`, (b) 1H-04 theo từng đơn, (c) = SEC 154-02 403 trước 409; DOM 154-02 `recognized_at` = lúc OWN sửa; DOM 154-01 dòng `void` giữ `recognized_at` như `voidCommissions`; SEC 154-01 kiểm độ sâu ở `canonicalJson` (`addGuestDocument` → 422, không ảnh, không bản ghi idempotency); ARC 149-01 đủ 4 điểm (bỏ chú thích bằng TypeScript parser, regex dấu phẩy/ONLY/ngoặc kép/schema, `{ reason, reads }` bằng đúng, controller dùng `seesFullAudit`); SEC 154-03 kiểm quyền người chốt trước các cờ (FD + cờ → 403 + một `access.denied`, không ghi gì). Không migration; khóa không đổi. Gộp thử `main` @ `49eaa33f` + #152 + #157 (mang #154): `tsc` sạch, API 218 tệp / 5182 ca xanh. 11 đột biến ARC: 10 đỏ (R1, R2, R4 của #154 nay đỏ); A10 xanh (chỉ sửa test quét). Thẻ 157-01 Suggestion: regex quét còn sót `USING`, `TABLE`, nối trong ngoặc, và bước lọc trước chưa có ca giữ. Đóng ARC 154-01, 149-01 khi gộp. #154 @ `4e81c3be` đã xanh CI kể cả E2E smoke. Không ESC | ARC | rounds/round-05/reviews/ARC-on-be-h-pr-157.md |
