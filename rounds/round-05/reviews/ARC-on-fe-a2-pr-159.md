# ARC review PR #159 (FE-A2) – `r5-fe-a2-followup`: bốn thẻ sau #145/#150 và DOM 155-04

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR: [#159](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/159), nhánh `r5-fe-a2-followup`, head **`f810e77b`**, `base = main`. Nhánh cắt từ `main` @ `dda49347`.
  - Có 4 commit, mỗi commit một thẻ. Quy mô: 6 tệp, +197/−37.
  - Mã: `MoneyPage.tsx` và `mocks/stay.ts`. Test: 3 tệp. Tài liệu: báo cáo FE.
  - Máy chủ, `openapi.yaml`, `strings.js` và tệp sinh đều không đổi.
- Đối chiếu:
  - thẻ ARC: `ARC-on-fe-prs-145-146.md` mục 8 (FB-R5-ARC-FE-145-04, 145-05, đột biến m5, m8) và `ARC-on-prs-140-124-98-102.md` mục 11.3 (FB-R5-ARC-FE-150-01);
  - thẻ DOM: `DOM-on-ops-pr-155-k14.md` (FB-R5-DOM-FE-155-04);
  - hợp đồng: `listCloserCandidates` (`openapi.yaml` dòng 2752, `x-roles` OWN/MGR/FDL/FD, `x-rbac` S05) và `listAuditEvents` (S27);
  - phân quyền: `rbac-matrix.md` (S05, S27, chú thích 37, dòng D27);
  - mã máy chủ: `closer-candidates.controller.ts`; `nav.ts` (màn `moneylog`, vai `DESK`).
- Cách kiểm:
  - ref riêng `refs/scratch/arc-pr159`, một worktree tạm ở scratchpad;
  - gộp thử với `main` @ `b5a15977`, mới hơn `629c56c1` FE-A2 đã dùng;
  - không checkout nhánh trong thư mục chính, không push vào nhánh PR;
  - worktree và ref tạm đã xóa sau review;
  - không dữ liệu khách, không số hoa hồng; test chỉ dùng tài khoản mẫu của mock.
- CI của `f810e77b` lúc viết: 7 job xanh, gồm contract RBAC `--strict`, Redocly, gitleaks, landing, shellcheck. Job `format · lint · audit · test · build` đang chạy.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Điều kiện gộp | Thẻ ARC |
|---|---|---|---|
| **#159 @ `f810e77b`** | **DUYỆT** – gộp khi CI xanh | Không có điều kiện nào ngoài CI xanh. DOM duyệt riêng mục 4 (155-04) | 159-01 (Suggestion) |

- Ba thẻ của ARC làm đúng đề xuất. ARC chạy lại các đột biến:
  - ARC-FE-145-04: ca lượt đã gia hạn, gõ 18:30 → `overdue_after_limit`. Đột biến m5 nay **đỏ**.
  - ARC-FE-145-05: câu cố định, không phụ thuộc ngày chạy. Đột biến m8 nay **đỏ**.
  - PR150-01 ý 1 và 2: bỏ 4 chỗ `{ timeout: 5000 }` cùng chú thích sai; báo cáo FE ghi G2 "Chưa sửa – chuyển QA". Ý 3 là việc của QA.
- **Giả định của FE-A2 ở 155-04 (đọc danh sách `kind=all`, FD/FDL cũng đọc): ARC xác nhận đúng về phân quyền và không làm lộ thêm dữ liệu.** Lý do ở mục 2. Tóm tắt:
  - vai được mở màn `moneylog` trùng đúng vai được gọi `listCloserCandidates`;
  - danh sách chỉ có `userId`, `displayName`, `kind`, không có trường hoa hồng hay liên lạc;
  - FD/FDL vốn đã đọc đúng danh sách `kind=all` này trong `BookingDialog`.
- Gộp thử sạch:
  - `tsc --noEmit` của admin-web: sạch.
  - Vitest admin-web: **98 tệp / 1092 ca xanh**, khớp số FE-A2.
  - Prettier, ESLint: sạch trên các tệp đổi.
- Đột biến ARC cho mục 4: 5 đột biến, 3 đỏ. B4 là đột biến tương đương. B3 còn xanh: chưa ca nào giữ chữ "Đang tải…" lúc danh sách đang tải. Đây là thẻ 159-01, mức Suggestion, không chặn gộp.
- Thẻ đóng khi #159 gộp: **ARC-FE-145-04**, **ARC-FE-145-05**, **FB-R5-ARC-FE-150-01** (ý 1, 2; ý 3 chuyển QA). DOM tự đóng 155-04.

---

## 1. Ba thẻ của ARC

| Thẻ | Commit | ARC kiểm | Kết quả |
|---|---|---|---|
| ARC-FE-145-04 (Minor) | `c4c4b93d` | Phần dựng dữ liệu gom thành `extendedOverdue()`: đơn gốc đi T−2, B13 gia hạn đêm T−2 → T−1 (đơn con), chưa ai trả phòng ngày T−1. Ca mới gõ 18:30 → mô tả nút `overdue_after_limit`, nút ở `aria-disabled`, không có câu "rạng sáng". Ca ARC 3.4 cũ (gõ 03:00) dùng cùng hàm, nội dung không đổi | Khớp. **m5** (`overdueEarlyAt(…, r.departureDate)` ở `CheckOutPage.tsx:798`) **đỏ** ở đúng ca mới. Trước đây m5 xanh |
| ARC-FE-145-05 (Suggestion) | `6d7f58e0` | Câu cố định `Khách đi 11:40 ngày 05/11/2026, thấy trống 12:45`. Test tự kiểm tiền đề: ghép chữ số được đúng 16 số, qua Luhn (hàm Luhn viết riêng trong test, không dùng hàm của mock), và `containsCardNumber` trả `false`. Như vậy ca này không còn phụ thuộc ngày chạy | Khớp. **m8** (mock dò số thẻ theo luật cũ: ghép mọi chữ số rồi thử Luhn) **đỏ** |
| FB-R5-ARC-FE-150-01 (Minor) | `d1d37614` | `r3-v1-feb-webreq`: bỏ đủ 4 chỗ `{ timeout: 5000 }` và chú thích "1 s default", như trên `main` trước #150. Báo cáo FE mục 8: G2 thành "Chưa sửa – chuyển QA (ARC 11.3)" | Khớp ý 1, 2. Ý 3 (QA ghi ca chập chờn luồng "yêu cầu website → H09") vẫn mở, ở phía QA |

Ghi chú, không thành thẻ: `v5-15-overdue-fea` và vài tệp khác dùng `{ timeout: 3000 }` trong `waitFor`. Ca mới của 145-04 cũng vậy. Con số này **nhỏ hơn** `asyncUtilTimeout` 5 s của `setup.ts`, nên nó làm thời gian chờ ngắn lại, không dài thêm. Đây là mẫu có từ trước PR này. Hôm nay mọi ca đều xanh, nên ARC không đòi sửa ở #159. Nếu QA gặp ca chập chờn ở các tệp này, nên kiểm con số đó trước.

## 2. DOM 155-04 (`f810e77b`): mã, phân quyền, dữ liệu

### 2.1 Mã
- Lỗi cũ: máy chủ ghi `reservation.closer_changed` với `before.closerUserId` / `after.closerUserId` (#154, bổ sung 1h), còn Desk đọc khóa `closer` mà máy chủ không bao giờ ghi. Hai tên vì thế luôn trống. Mock cũng ghi theo khóa sai, nên test cũ không thấy lỗi. Nay mock seed dùng đúng dạng máy chủ.
- `AuditAction` đổi id thành tên qua `names.byId`, lấy từ danh sách `closer-candidates`, `kind=all`:
  - không có id (đơn chưa có người chốt trước đó, hoặc dòng ghi trước #154) → "—";
  - id không có trong danh sách (tài khoản khóa, đã nghỉ, mất vai) → `mlog.who_unlisted`, cùng cách ô lọc "Người làm" đang làm;
  - danh sách đang tải → `common.loading`; danh sách lỗi → `mlog.who_unlisted`. Không bao giờ hiện id ra màn hình.
- Ô lọc "Người làm" vẫn chỉ có nhân viên: lọc phía client `kind === 'staff'`, đúng như trước. Ô này chỉ hiện với MGR/OWN.
- Không thêm chữ mới, không thêm màu hay font. `strings.js` không đổi. Hai câu riêng DOM đề xuất (dòng trước v1.0.5, tài khoản đã khóa) đang chờ UXD qua ORC. Tạm dùng "—" và `mlog.who_unlisted`, đều là chữ đã duyệt.

### 2.2 Phân quyền: ARC xác nhận đúng
- Màn `moneylog` (S27) chỉ mở cho `DESK` = `owner`, `manager`, `front_desk_lead`, `front_desk` (`nav.ts:33`, `:157`). `listAuditEvents` có cùng 4 vai.
- `listCloserCandidates` có `x-roles: [owner, manager, front_desk_lead, front_desk]`. `openapi-meta.ts` sinh ra cùng 4 vai này, guard của máy chủ dùng chúng. Mock cũng chặn bằng `FD_PLUS`.
  - Vậy mọi người mở được trang đều gọi được danh sách. Không có đường 403 mới, nên không sinh thêm `access.denied` nào.
  - SAL/CTV không vào S27, nên không gọi danh sách.
- Trước PR, FD/FDL không gọi danh sách ở trang này. Đó là vì nó chỉ phục vụ ô lọc của MGR, không phải vì quyền.
- `kind=all` không mở thêm quyền: `kind` chỉ là bộ lọc trong bộ nhớ trên **cùng một** câu truy vấn của máy chủ.

### 2.3 Dữ liệu: không lộ thêm
- Mỗi phần tử chỉ có `userId`, `displayName`, `kind`. Đây là cả câu `SELECT` của `closer-candidates.controller.ts`, đúng D27 và chú thích 37 của rbac-matrix.
  - Không có username, SĐT, email, trạng thái khóa.
  - Không có trường hoa hồng nào: không tỷ lệ, không số tiền, không trạng thái hoa hồng.
- FD/FDL vốn đã đọc đúng danh sách này (`kind=all`) ở `BookingDialog.tsx:403`, khi chọn người chốt. Trang Nhật ký tiền không cho họ thấy tên nào mà họ chưa thấy.
- Tên chỉ hiện trên dòng `reservation.closer_changed`, có `entityType = reservation`. Hai cổng của máy chủ không đổi:
  - FD/FDL chỉ đọc dòng của chính mình (S27 "M");
  - cổng `audit-visibility` của #149 bỏ mọi dòng `commission.*` và khóa `commissionVnd` với vai dưới OWN/MGR.
  Vì vậy màn hình biết được "ai thay ai", nhưng không biết hoa hồng là bao nhiêu.
- Chi phí: thêm một GET (tối đa 200 dòng, không phân trang) mỗi lần mở trang. Không đáng kể ở quy mô 10 căn.
- Một chỗ tài liệu cần đồng bộ, không chặn gộp:
  - chú thích 37 và dòng D27 của rbac-matrix, cùng mô tả `listCloserCandidates` trong `openapi.yaml`, mới nói "tên người chốt khi tạo đơn ở S05";
  - nay tên đó cũng hiện trên dòng "Đổi người chốt" ở S27, cùng vai, cùng dữ liệu.
  ARC thêm câu này vào mô tả `listCloserCandidates` ở 0.3.14 (mục 6). BA thêm vào chú thích 37 và D27 ở lần sửa rbac-matrix kế tiếp. Chỗ này nằm ngoài mục 3 (màn hình), nên không đụng test `SCREENS_BY_ROLE`.

### 2.4 Test và đột biến
- Tệp mới `r5-mlog-closer-names-fea.test.tsx`, 3 ca:
  - MGR: tên sale và CTV; tài khoản khóa; không có người chốt trước; dòng trước #154; không id nào lộ ra; CTV không có trong ô lọc;
  - FD: tên hiện, không có ô lọc;
  - danh sách lỗi 500: không kẹt ở "Đang tải…".
- FE-A2 báo 6 đột biến đều đỏ. ARC chạy thêm 5 đột biến của mình trên cây gộp thử:

| Mã | Đột biến ARC | Kết quả |
|---|---|---|
| B1 | Bản đồ tên lấy từ `staff` thay vì cả danh sách (CTV mất tên) | **Đỏ** (2 ca) |
| B2 | Id không có trong danh sách → hiện chính id | **Đỏ** (2 ca) |
| B3 | Bỏ nhánh `loading`: lúc danh sách đang tải hiện ngay `mlog.who_unlisted` | Xanh → thẻ 159-01 |
| B4 | `String(v ?? '')` thay cho kiểm `typeof v === 'string'` | Xanh. Tương đương: máy chủ chỉ ghi chuỗi hoặc `null` |
| B5 | Cột "từ" đọc `after.closerUserId` | **Đỏ** (3 ca) |

## 3. Thẻ feedback ARC

### FB-R5-ARC-FE-159-01
- Mức độ: **Suggestion** (không chặn gộp; làm cùng lần FE-A2 thêm hai câu riêng của DOM 155-04, khi UXD đưa khóa chữ)
- Người sửa: FE-A2
- Vị trí: `apps/admin-web/src/__tests__/r5-mlog-closer-names-fea.test.tsx`; mã ở `MoneyPage.tsx` `AuditAction`, hàm `who`
- Vấn đề: chưa ca nào giữ chữ `common.loading` trong lúc danh sách người còn đang tải. Bỏ nhánh này (B3) thì cả 3 ca vẫn xanh, vì `waitFor` chờ tới khi tên hiện.
- Vì sao quan trọng: thiếu nhánh này, mỗi lần mở trang, dòng "Đổi người chốt" sẽ thoáng ghi "người không có trong danh sách" cho cả những người có trong danh sách. Người xem có thể chụp màn hình hay báo lỗi đúng lúc đó. Ô lọc "Người làm" đã có ca giữ đúng hành vi này (FB-R5-ARC-FE-140-03).
- Đề xuất sửa: thêm một ca. Cho `closer-candidates` trả chậm, ví dụ `await delay(...)` trong `server.use`, hoặc một promise test tự mở. Kiểm dòng hiện `common.loading` trước, rồi mới hiện tên. B3 phải đỏ.
- Trạng thái: Open

## 4. Gộp thử

- `main` @ `b5a15977` + #159 @ `f810e77b`: git tự gộp, không xung đột.
- `pnpm install --frozen-lockfile`, build các gói phụ thuộc của admin-web, rồi `tsc --noEmit`: sạch.
- Vitest admin-web: **98 tệp / 1092 ca xanh**. `v5-15-overdue-fea` có 22 ca (thêm 1); tệp mới có 3 ca.
- Prettier `--check` và ESLint trên các tệp mã đổi: sạch.

## 5. Ghi chú cho ORC

- Gộp khi job test/build của `f810e77b` xanh. PR không đụng máy chủ, nên không phụ thuộc thứ tự với #152/#154/#157.
- QA: ý 3 của FB-R5-ARC-FE-150-01 vẫn mở, tức ghi ca chập chờn luồng "yêu cầu website → H09". Khi ghi, nên xem cả `{ timeout: 3000 }` ở mục 1.
- UXD: hai câu riêng DOM 155-04 đề xuất vẫn chờ khóa chữ. Thẻ 159-01 làm cùng lần đó.
- BA: thêm "tên người chốt trên dòng 'Đổi người chốt' ở S27" vào chú thích 37 và D27 của rbac-matrix (mục 2.3).
- Tài nguyên tạm đã xóa: worktree `wt159`, ref `refs/scratch/arc-pr159`.

## 6. Việc của ARC

- 0.3.14, mô tả `listCloserCandidates`: thêm "Desk còn dùng danh sách này để hiện tên người chốt trên dòng `reservation.closer_changed` của Nhật ký tiền (S27); cùng vai, cùng trường". Chỉ mô tả, không đổi schema.

## 7. Điểm làm tốt

- Mỗi thẻ một commit, mỗi commit nêu đột biến ARC dùng để kiểm.
- Ca 145-05 tự chứng minh tiền đề của nó: câu đủ 16 số, qua Luhn, nhưng không phải số thẻ. Nhờ vậy ca không thể xanh vì dữ liệu chọn sai.
- 155-04 sửa cả mock seed về đúng dạng máy chủ. Lỗi cũ sống được chính vì mock và màn cùng đọc một khóa sai.
- Phần giải thích quyền trong mô tả PR nêu rõ cả giả định lẫn lý do. ARC kiểm theo đó rất nhanh.

## 8. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC DUYỆT FE-A2 #159 (`r5-fe-a2-followup`) @ `f810e77b`, gộp khi CI xanh. ARC-FE-145-04 (ca lượt đã gia hạn, gõ 18:30 → `overdue_after_limit`; m5 nay đỏ), ARC-FE-145-05 (câu cố định, tự kiểm 16 số qua Luhn và `containsCardNumber` false; m8 nay đỏ), FB-R5-ARC-FE-150-01 ý 1, 2 (bỏ 4 chỗ `{ timeout: 5000 }`, G2 "Chưa sửa – chuyển QA"; ý 3 ở QA): đóng khi gộp. DOM 155-04: ARC xác nhận giả định của FE-A2 – Nhật ký tiền đọc `closer-candidates` `kind=all` cho mọi vai của S27 là đúng phân quyền (S27 và `listCloserCandidates` cùng 4 vai OWN/MGR/FDL/FD; `kind` chỉ lọc trong bộ nhớ) và không lộ thêm dữ liệu (chỉ `userId`, `displayName`, `kind` theo D27; FD/FDL vốn đọc đúng danh sách này ở `BookingDialog`; dòng hoa hồng và `commissionVnd` vẫn bị cổng #149 ẩn với vai dưới MGR). Gộp thử `main` @ `b5a15977`: `tsc` sạch, admin-web 98 tệp / 1092 ca xanh. 5 đột biến ARC: 3 đỏ, B4 tương đương, B3 xanh → thẻ 159-01 Suggestion (ca giữ chữ "Đang tải…" lúc danh sách đang tải). Tài liệu đồng bộ: ARC thêm câu S27 vào mô tả `listCloserCandidates` ở 0.3.14; BA thêm vào chú thích 37 và D27 của rbac-matrix. Không ESC | ARC | rounds/round-05/reviews/ARC-on-fe-a2-pr-159.md |
