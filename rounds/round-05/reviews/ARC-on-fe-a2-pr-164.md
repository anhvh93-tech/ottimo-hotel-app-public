# ARC review PR #164 (FE-A2) – 159b: dòng "Đổi người chốt" ở Nhật ký tiền, sau #159

- Round 5 (v1.0.5), bước **Review** kỹ thuật, bản ngắn. Người review: ARC. Ngày 07/11/2026.
- PR: [#164](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/164), head **`dbef4c71`**, `base = main`.
  - Có 2 commit: `94bf0861` (mã, chữ) và `dbef4c71` (ca test).
  - Quy mô: 7 tệp, +69/−12. Gồm `MoneyPage.tsx`, test `r5-mlog-closer-names-fea`, 2 khóa UXD 9.18 sinh từ `gen_strings.py`.
  - Máy chủ và `openapi.yaml` không đổi.
- Đối chiếu:
  - UXD `copy-v1.0.5.md` 9.18 (bản 2.6, sửa ở bản 2.7);
  - DOM FB-R5-DOM-FE-159-01;
  - ARC FB-R5-ARC-FE-159-01 (`ARC-on-fe-a2-pr-159.md` mục 3);
  - mã máy chủ ghi `reservation.closer_changed`.
- Cách kiểm:
  - ref riêng, worktree tạm `arc-wt164` ở scratchpad, gộp thử với `main` @ `c82802a8`;
  - đã xóa worktree và ref sau review;
  - không dữ liệu khách, không số hoa hồng.
- CI của `dbef4c71` lúc viết: `format · lint · audit · test · build`, landing, shellcheck đều xanh.

## 0. Kết luận

**DUYỆT** – gộp khi CI xanh. Không thẻ mới. Đóng **FB-R5-ARC-FE-159-01** khi #164 gộp.

| Việc | Mã | Kết quả |
|---|---|---|
| UXD 9.18, `mlog.a_closer_changed_legacy` | `!('closerUserId' in after)` → cả dòng là một câu, không còn "— → —". Xét **khóa có mặt**, không xét giá trị, đúng chữ 9.18. Ca `OTM-C08` (`after.closerUserId: null`) giữ dòng có tên | Khớp |
| UXD 9.18, `mlog.closer_inactive` | Id không có trong danh sách đã tải xong. Ô lọc "Người làm" vẫn dùng `mlog.who_unlisted` | Khớp |
| DOM 159-01 | Danh sách lỗi → `common.error_generic_title` cho từng id, không bao giờ "không hoạt động" cho mọi người | Khớp |
| ARC 159-01 | Ca mới chặn câu trả lời của `closer-candidates` bằng một promise: dòng hiện "Đang tải… → Đang tải…", rồi ra tên sau khi mở. Đột biến B3 của ARC (bỏ nhánh `loading`) nay **đỏ** (D2) | Khớp. Đóng thẻ |

- Máy chủ ghi `before: { closerUserId: <cũ> }, after: { closerUserId }` từ khi có sự kiện này. Allowlist audit (`reservations/audit-entities.ts`, SR-AUD-03) lọc khóa **lúc ghi**, và `closerUserId` chỉ vào allowlist từ #154.
  - Vì vậy dòng cũ không có khóa trong `after`, còn dòng mới luôn có khóa, có thể mang giá trị `null`.
  - Phép kiểm khóa có mặt tách đúng hai loại.
- `PeopleNames.status` lấy thẳng `people.state.status` (`loading`/`ready`/`error`). `tsc` xác nhận hai kiểu khớp.

## 1. Gộp thử, test, đột biến

- `main` @ `c82802a8` + #164: git tự gộp. `gen_strings.py` không lệch, `tsc` sạch. Admin-web **99 tệp / 1101 ca xanh**, khớp số FE-A2. Prettier và ESLint sạch.
- **Đụng với #162:**
  - Gộp thêm #162 lên cây trên thì xung đột ở `design/wireframes/assets/strings.js`. Tệp sinh này chỉ có một dòng, nên hai PR cùng thêm khóa là chắc chắn xung đột.
  - Các tệp nguồn (`gen_strings.py`, `strings-*.json`, `strings-tables.md`) git tự gộp.
  - ARC đã gỡ bằng cách lấy một bên rồi chạy lại `python3 design/tools/gen_strings.py`. Sau đó: không lệch, đủ khóa của cả hai PR, `tsc` sạch, admin-web **100 tệp / 1136 ca xanh**.
  - PR gộp sau phải làm đúng bước này trên nhánh của mình. Bước CI "Copy is generated" sẽ kiểm.
- Đột biến ARC trên `MoneyPage.tsx`, chạy tệp test của dòng này (4 ca):

| Mã | Đột biến | Kết quả |
|---|---|---|
| D1 | Xét `!after.closerUserId` (giá trị) thay vì khóa có mặt | **Đỏ** (ca `OTM-C08`) |
| D2 | Bỏ nhánh `loading` (B3 của #159) | **Đỏ** (ca ARC 159-01) |
| D3 | Lỗi tải danh sách → `closer_inactive` | **Đỏ** (ca DOM 159-01) |
| D4 | Id vắng → `who_unlisted` như cũ | **Đỏ** |
| D5 | Bỏ câu bản ghi cũ | **Đỏ** (ca `OTM-C04`) |
| D6 | Xét khóa trong `before` thay vì `after` | Xanh. Tương đương trên dữ liệu thật, vì máy chủ luôn ghi khóa ở cả hai phía. 9.18 nói `after`, mã làm đúng |

## 2. Ghi chú cho ORC

- Thứ tự với #162: PR nào gộp sau phải chạy lại `gen_strings.py` để gỡ `strings.js` (mục 1). Không cần sửa tay nội dung.
- Tài nguyên tạm đã xóa: worktree `arc-wt164`, ref `refs/scratch/arc-pr164`, `refs/scratch/arc-pr162`.

## 3. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC DUYỆT FE-A2 #164 (159b, dòng "Đổi người chốt" ở Nhật ký tiền) @ `dbef4c71`, gộp khi CI xanh. UXD 9.18: `mlog.a_closer_changed_legacy` khi `after` không có khóa `closerUserId` (xét khóa có mặt, không xét giá trị; `null` vẫn ra dòng có tên); `mlog.closer_inactive` cho id vắng trong danh sách đã tải; ô lọc vẫn `who_unlisted`. DOM 159-01: danh sách lỗi → `common.error_generic_title`. ARC 159-01: ca chặn câu trả lời → "Đang tải…" rồi ra tên; B3 nay đỏ → đóng. Gộp thử `main` @ `c82802a8`: `gen_strings` không lệch, `tsc` sạch, admin-web 99 tệp / 1101 ca xanh; thêm #162: xung đột ở `strings.js` (tệp sinh một dòng), gỡ bằng chạy lại `gen_strings.py` → 100 tệp / 1136 ca xanh – PR gộp sau tự làm bước này. 6 đột biến ARC: 5 đỏ, D6 tương đương. Không thẻ mới, không ESC | ARC | rounds/round-05/reviews/ARC-on-fe-a2-pr-164.md |
