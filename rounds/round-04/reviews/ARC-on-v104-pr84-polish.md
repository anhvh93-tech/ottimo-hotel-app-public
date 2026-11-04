# ARC review – PR #84 `v104/fe-polish-049`: BUG-R4-049 (P3) và test FB-R4-ARC-FE-PR82-05

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Đối tượng:
  - lượt chính @ `3fa3428f`, base `main` @ `e99eba55`, đọc bằng `git diff origin/main...origin/v104/fe-polish-049`;
  - phần thêm @ `7c7eaadb`, một lần đẩy thường trên `3fa3428f` theo thẻ UXD FB-R4-UXD-FE-PR84-01 (mục 3).
- Tệp (3): `CheckInPage.tsx`, `bug-r4-049-fea.test.tsx` (mới), `v104-booking-rate-carryover.test.tsx`. Không có khóa chữ mới.
- Đọc kèm:
  - thẻ FB-R4-ARC-FE-PR82-05 (`ARC-on-v104-pr82-rate-source.md` mục 11.3);
  - `checkin.service.ts` trên `main`: `room`, `not_unassigned`;
  - trigger erd 7 (`0014_reservations_rls_be_a.sql`);
  - `CheckInPreview` trong `openapi.yaml`.
- ARC tự chạy trong worktree tạm (đã xóa khi xong). Máy tải ~2–3.

## Phán quyết (head `7c7eaadb`): **ĐẠT**

Phần sửa đúng và hẹp.
- BUG-R4-049: H13 chỉ in `ci.cond_room` và nay cả `ci.cond_capacity_ok` khi đơn đã có căn. Điều kiện `hasRoom` đúng là điều kiện mà `roomBlockedMessage` đã dùng ở BUG-R4-039, nay gom về một biến.
- Hai ca của BUG-R4-049 đỏ khi bỏ phần sửa tương ứng.
- Ca mới cho PR82-05 đóng đúng lỗ ARC nêu: đột biến Z1 (đúng một dòng) nay chỉ bị ca này bắt.

Không có thẻ Blocker, Major hay Minor. Gộp được khi job `format · lint · audit · test · build` của run 41906960634 xanh. Lúc kiểm, các job khác đã xanh hoặc đang chạy.

## 1. BUG-R4-049 – `hasRoom` có đúng không

| Điểm | Kết luận |
|---|---|
| `hasRoom = !!cond('not_unassigned')?.met && !!room` | Đúng. Máy chủ: `not_unassigned.met = conflict_state !== 'open'`. Trigger erd 7 chỉ cho `room_id` rỗng khi đơn OTA đang `open`; hai đường mở xung đột (B7b, khôi phục no-show) đều đặt `room_id = NULL` cùng lúc. Nên với dữ liệu thật, `hasRoom` trùng với `!!room` của máy chủ. Thêm `!!room` ở Desk là chốt an toàn khi số căn rỗng |
| `roomBlockedMessage(roomCond, hasRoom)` | Chỉ đổi tên biến, không đổi giá trị truyền vào. Hành vi BUG-R4-039 không đổi |
| `condDetail` `room_ready` → `null` khi `!hasRoom` | Đúng. Các nhánh khác của `condDetail` vốn trả `null`; chỗ gọi (`condDetail(c) ? <div>… : null`) đã xử lý |
| Những chỗ khác còn in `{room}`/`{status}` | `checkin.room_not_ready_lead` / `room_not_ready` chỉ hiện khi `roomOverridable`. Máy chủ chỉ trả `overridableBy` khi có căn (C1), nên không đến được khi chưa có căn |
| Hợp đồng | `CheckInPreview.roomStatus` là trường **bắt buộc**. Khi chưa có căn, máy chủ lấp `VC`. #84 không đổi hợp đồng, đúng |

Về "cách triệt để là để trống `roomStatus`" trong thân PR – **ARC chọn không đổi schema**:
- Bỏ `roomStatus` khỏi `required` là thu hẹp hợp đồng.
- Desk đã có `not_unassigned`, và erd 7 bảo đảm "chưa có căn ⇔ xung đột đang mở".
- v1.0.5 chỉ sửa **mô tả**: "đơn chưa có căn (`not_unassigned` chưa đạt): `roomStatus` là giá trị lấp chỗ, không mang nghĩa – Desk không hiển thị". ARC tự làm cùng gói hợp đồng 0.3.13, không cần ESC.

## 2. FB-R4-ARC-FE-PR82-05 – ca mới có đúng thẻ không

- Ca "Trực tiếp, 1 đêm gõ `0`" khẳng định đúng ba điều thẻ đề nghị:
  - `booking.error.rate_empty` trong ô của đêm đó;
  - không có `booking.error.rate_zero_internal` ở cả hộp thoại;
  - không có POST (`sent` rỗng, không có thông báo "Đã tạo đơn").
- ARC chạy đột biến:
  - **Z1 đúng một dòng** (dòng 548, phần chọn câu: `form.group === 'internal'` → `true`): **chỉ ca mới đỏ** (1 failed / 31 passed). Ở #82, Z1 lọt cả 954 test. Lỗ đã đóng.
  - Lần thử đầu của ARC dùng `sed` theo mẫu và đổi nhầm thêm 2 dòng cùng mẫu (563 và 598), làm đỏ thêm 2 ca khác. Lần thử đó không tính.
  - **Z3** (bỏ phép thử ô ≤ 0): đỏ 2 ca, gồm ca Nội bộ cũ và ca mới. Phép thử ô ≤ 0 nay có test cho cả kênh khác Nội bộ.
- Thẻ PR82-05: **Fixed @ `3fa3428f`**. Phần "có thể thêm cùng cách cho OTA" của thẻ là gợi ý, không bắt buộc; chưa làm.

## 3. Phần thêm `3fa3428f..7c7eaadb` (thẻ UXD FB-R4-UXD-FE-PR84-01)
- `CheckInPage.tsx`, một dòng: `capacity_within_max` → `c.met && hasRoom ? t('ci.cond_capacity_ok', …) : null`.
  - Đơn chưa có căn không còn hiện "{n} khách · căn  tối đa –".
  - Điều kiện chưa đạt vẫn trả `null` như trước.
  - Không có khóa mới.
- Test `bug-r4-049-fea`:
  - ca chưa có căn thêm khẳng định dòng sức chứa có `ci.met`, không có "tối đa", không có "–";
  - ca đối chứng thêm khẳng định "căn 302 tối đa \d+".
- ARC bỏ riêng dòng sửa này: ca chưa có căn đỏ ("Expected element not to have text content"). Ca đối chứng xanh.
- Ghi chú "để v1.0.5" trong thân PR về `cond_capacity_ok` nay không còn cần.

## 4. Kiểm lại bằng chạy thật

| Lần chạy | Kết quả |
|---|---|
| `bug-r4-049-fea` + `v104-booking-rate-carryover` @ `3fa3428f` | 34 passed (34) |
| @ `3fa3428f`, bỏ phần sửa `room_ready` | 1 failed / 33 passed – ca chưa có căn đỏ |
| @ `3fa3428f`, Z1 đúng một dòng | 1 failed / 31 passed (chỉ chạy `carryover`) – chỉ ca mới PR82-05 đỏ |
| @ `3fa3428f`, Z3 | 2 failed / 32 passed – ca Nội bộ gõ 0 và ca mới |
| 19 tệp test có trang nhận phòng + `carryover` + `i18n-keys` @ `7c7eaadb` | **21 tệp, 253 passed (253)**. Gồm `bug-r4-039-fea`, `checkin`, `ota-rules` |
| @ `7c7eaadb`, bỏ riêng dòng sửa sức chứa | 1 failed / 1 passed – ca chưa có căn đỏ |
| `tsc --noEmit` (admin-web), `prettier --check` 3 tệp @ `7c7eaadb` | Sạch |
| `git merge-tree origin/main 7c7eaadb` (`main` `a35a5625`) | Sạch |
| `gh pr checks 84` (run 41906960634) | 4 job xanh: API contract, Redocly, confidential, no test endpoints. Job test, shellcheck, gitleaks, landing đang chạy |

## Thẻ feedback
Không có thẻ mới.

Ghi nhận:
- Thẻ đã đóng: FB-R4-ARC-FE-PR82-05 (`3fa3428f`), FB-R4-UXD-FE-PR84-01 (`7c7eaadb`, UXD xác nhận).
- Việc ARC tự làm ở v1.0.5: câu mô tả `CheckInPreview.roomStatus` (mục 1).

## Điểm làm tốt (nên giữ)
- Gom `hasRoom` về một biến, dùng cho cả câu chặn, dòng buồng và dòng sức chứa. Lần sau thêm dòng phụ có `{room}` sẽ dùng lại điều kiện này.
- Ca test có ca đối chứng (đơn có căn vẫn hiện số căn và trạng thái). Sửa quá tay, như ẩn với mọi đơn, cũng bị bắt.
- PR ghi rõ đột biến đã thử. ARC chạy lại ra cùng kết quả.

## Dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | #84 @ `7c7eaadb` ĐẠT: BUG-R4-049 và UXD PR84-01 (H13 không in dòng phụ buồng/sức chứa khi đơn chưa có căn, dùng `hasRoom` như BUG-R4-039), FB-R4-ARC-FE-PR82-05 đóng. Gộp khi CI run 41906960634 xanh. `CheckInPreview.roomStatus` giữ bắt buộc; v1.0.5 chỉ sửa mô tả (giá trị lấp chỗ khi chưa có căn) | ARC | Ca mới đỏ khi bỏ sửa; Z1 một dòng chỉ ca mới bắt; 253/253 test trang nhận phòng xanh; erd 7 bảo đảm chưa có căn ⇔ xung đột mở, nên không cần thu hẹp hợp đồng |
