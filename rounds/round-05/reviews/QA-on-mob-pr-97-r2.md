# QA kiểm lại PR #97 (MOB V5-15 "Báo cần dọn") sau lượt sửa – lần 2

- Round 5 (v1.0.5), bước **Kiểm thử**, góc kiểm thử. Người kiểm: QA. Ngày 07/11/2026.
- PR: **#97** `r5-mob-v5-15-clean` @ **`3cc9c1e6`**. Đây là commit gộp `main` và sinh lại `strings.js`. Nội dung sửa của MOB nằm ở **`f6a5b7f6`**.
- Lần review trước: `QA-on-prs-97-122.md` @ `d3081f93`, kết luận DUYỆT CÓ ĐIỀU KIỆN, thẻ QA 97-01 (Minor) và 97-02 (Suggestion).
- Đã đọc:
  - commit `f6a5b7f6`;
  - review cũ của UXD (`UXD-on-prs-97-116-117-118-122.md` mục 4.2, 7 và thẻ PR97-01…03) và ARC (`ARC-on-fe-mob-prs-97-116-118-122.md` thẻ MOB-97-01, 97-02);
  - máy chủ `housekeeping.service.ts` `transitionRoomStatus`: thứ tự kiểm là 404 căn → phạm vi T → `performedAt` → `expectedFrom`. Mock mới theo đúng thứ tự này.

Cách kiểm:
- Worktree tách riêng trong scratchpad tại `3cc9c1e6`, `pnpm install --offline`. Không checkout bản làm việc chung. Xóa worktree sau khi kiểm.
- Chạy tệp test của PR và cả bộ mobile. Thử đột biến bằng tay, mỗi lần một chỗ (mục 2).
- Ca của UXD chạy hai lớp:
  - vitest của MOB (jsdom);
  - Chromium thật 375 × 812 trên máy chủ dev của app ở chế độ mock, đo tọa độ nút (mục 3).
- Không gọi staging hay production. Chỉ dữ liệu mock. Tệp này không có bí mật, mật khẩu hay dữ liệu khách.

---

## 0. Kết luận

| PR | SHA | Kết luận QA | Điều kiện |
|---|---|---|---|
| #97 | `3cc9c1e6` | **DUYỆT CÓ ĐIỀU KIỆN** | (1) CI của `3cc9c1e6` xanh, kể cả job E2E. Lúc viết, run `42283008021` còn chạy: `format · lint · audit · test · build` đang chạy, job E2E chưa bắt đầu; các job đã xong đều xanh. QA đọc kết quả job E2E trước khi ORC gộp. (2) Staging v1.0.5: TC-V105-15-01…14 đạt (-05 là ca thăm dò, không chặn). Không cần MOB sửa gì thêm |

- 0 Blocker · 0 Major · 0 Minor · 0 Suggestion mới.
- Thẻ cũ: **FB-R5-QA-MOB-97-01 → Closed**, **FB-R5-QA-MOB-97-02 → Closed** (mục 1).
- Ca của UXD: **đạt** ở cả vitest và Chromium thật (mục 3).
- Kiểm che dữ liệu cá nhân trên 3 ảnh 375 px của MOB: **ĐẠT** (mục 4).
- ESC mới: **không**.

---

## 1. Thẻ QA cũ

| Thẻ | Yêu cầu | Ở `3cc9c1e6` | Trạng thái |
|---|---|---|---|
| 97-01 (1) P1 | Báo cần dọn rồi Bắt đầu dọn khi lệnh đầu còn chờ → hai lệnh đúng thứ tự | Ca "… two commands in order, OC → OD then OD → CL (QA P1)". Kiểm cả `event`, `expectedFrom`, trạng thái cuối CL và không có "Cần xem lại". Đột biến N4 chết | Đạt |
| 97-01 (2) P2 | Chạm đúp khi mất mạng, gửi muộn 20 phút → một lệnh, `performedAt` = giờ chạm | Ca "offline, two taps in one tick, back online 20 min later…". Đột biến N5, N6 chết | Đạt |
| 97-01 (3) P3 | 404 lúc gửi (HK ra khỏi phạm vi T) → "Cần xem lại", không mất lặng lẽ | Ca "HK leaves scope T while it waits (task cancelled): 404 → Cần xem lại, room stays OC". Đột biến N7 chết | Đạt |
| 97-02 (1) | Mock phạm vi T như `scopeRooms`: việc của ngày, không hủy, chưa giao ai hoặc giao cho chính mình | `inHkScope` mới xét đủ ba điều kiện. Thêm việc ngày trước còn mở (`OF_DAY`). 3 ca mới. Đột biến N8, N9, N10 chết | Đạt |
| 97-02 (2) | Có test giữ điều kiện `writable` | Ca "read-only session: no button even if the server lists needs_cleaning", dùng `scenario.allowedEventsOf`. Đột biến N1 (đột biến M4 cũ, lần trước sống) **nay chết** | Đạt |

Thẻ của làn khác, QA chỉ kiểm phần có test (UXD và ARC tự đóng thẻ của mình):
- UXD PR97-01 và ARC MOB-97-01:
  - nút là nút phụ trong thân màn, ngay trên "Báo sự cố căn này";
  - căn OC không có chân màn;
  - chạm lần hai sau 150 ms không rơi vào "Bắt đầu dọn".
  - Đột biến N2, N3 chết.
- UXD PR97-02 (câu `hk.queue.r.time_report`): đột biến N12 chết.
- UXD PR97-03 (dòng giải thích `hk.needs_cleaning_help`): có trong ca vị trí.
- Mock căn 301 có `currentGuest` như máy chủ (UXD mục 7): đột biến N11 chết.

---

## 2. Bộ test và đột biến

| Bản chạy | Kết quả |
|---|---|
| Tệp của PR `v105-needs-cleaning.test.tsx` | **27/27** (15 ca cũ + 12 ca mới) |
| Cả bộ mobile | 15 tệp, **193/193** |
| `tsc` mobile | 0 lỗi |
| eslint (4 tệp sửa), prettier (`apps/mobile/src`, `strings-*.json`) | 0 lỗi |
| `gen_strings.py` chạy lại trong worktree | Không đổi tệp nào (tệp sinh khớp nguồn) |
| `git merge-tree` với `main` @ `b77508f3` | Không xung đột. `main` không đổi `apps/mobile` hay tệp chữ sau `74189d2c`, nên kết quả trên áp cho bản gộp |

Đột biến trên mã sản phẩm và mock, chạy lại tệp của PR. **12/12 chết.**

| Mã | Đột biến | Ca bắt |
|---|---|---|
| N1 | `RoomPage.tsx`: bỏ `writable &&` (M4 cũ) | read-only session |
| N2 | `RoomPage.tsx`: đưa nút lại vào ô nút chính chân màn | 16 ca |
| N3 | `RoomPage.tsx`: nút trong thân thành kiểu chính `pri` | ca vị trí |
| N4 | `RoomPage.tsx`: Bắt đầu dọn lấy `expectedFrom` từ trạng thái máy chủ, không theo lớp phủ | P1 |
| N5 | `queue.ts`: đóng `performedAt` lúc gửi | P2 và ca chạm đầu tiên |
| N6 | `actions.ts`: bỏ khử trùng lặp lần chạm thứ hai | P2, "two taps before the screen re-draws" |
| N7 | `queue.ts`: 404 coi như đã áp dụng | P3 |
| N8 | mock: phạm vi T bỏ qua người được giao | ca giao cho HK khác |
| N9 | mock: phạm vi T bỏ qua ngày của việc | ca việc ngày trước |
| N10 | mock: kiểm `performedAt` trước phạm vi T | ca HK ngoài phạm vi T |
| N11 | mock: căn 301 không có `currentGuest` | ca "Dọn xong" căn có khách, 11 giây |
| N12 | `messages.ts`: không dùng câu PR97-02 | ca 422 PERFORMED_AT_OUT_OF_RANGE |

---

## 3. Ca của UXD: Dọn xong căn có khách, chờ 11 giây

Ca: "Dọn xong căn có khách rồi chờ 11 giây, chân màn không có nút Báo cần dọn" (UXD mục 7).

- **vitest (MOB):** ca "Dọn xong on a guest room, 11 s later: Báo cần dọn is back in the body, the footer stays empty" qua. Ca kiểm:
  - `.hk-foot` không còn;
  - nút Báo cần dọn không nằm trong chân màn;
  - căn ở OC.
  - Đột biến N2 và N11 làm ca này đỏ.
- **Chromium thật, 375 × 812, máy chủ dev chế độ mock**, đi trọn căn 301 · The Velvet (khách đang ở): Báo cần dọn → 11 giây → Bắt đầu dọn → 11 giây → Dọn xong → 11 giây. **4/4 đạt.**
  - Căn OC lúc đầu: Báo cần dọn không ở chân màn.
  - 11 giây sau Dọn xong: không có chân màn (`.hk-foot` đếm 0, không nút nào).
  - Nút Báo cần dọn quay lại trong thân màn ở (16, 486, 343 × 56), đúng chỗ trước khi bấm. Nút Dọn xong vừa bấm ở (16, 679, 343 × 56). Hai vùng **không chồng nhau**, nên lỗi UXD tả ở mục 4.2 (nút đen hiện đúng tọa độ nút Dọn xong) không còn.
  - Trong 10 giây Hoàn tác sau Dọn xong, căn hiện "Khách đang ở – đã dọn" và chưa có Báo cần dọn (`eventsFor` trả rỗng khi OC đang chờ). Không chạm nhầm được.

---

## 4. Kiểm che dữ liệu cá nhân – 3 ảnh 375 px của MOB

- Ảnh: `mob-97-375-oc.png`, `mob-97-375-queued.png`, `mob-97-375-after-finish.png` (750 × 1624, dữ liệu mock).
- Kết quả: **ĐẠT.**
- QA không commit ảnh. Người giữ ảnh commit vào thư mục output của mình.

---

## 5. Ghi nhận chập chờn (danh sách E2E chập chờn của QA)

- **Landing TC-LP-015, 375 px EN** (`e2e/landing/form.landing.spec.ts:15`):
  - lỗi: axe `target-size` ở liên kết của bảng tóm tắt lỗi `a[href$="#f-phone"]`;
  - đỏ **2 lần trong một run** (lần đầu và lần thử lại), run `42277411944` của PR #125. Lần chạy sau xanh.
  - #125 không đụng landing, nên không phải lỗi do PR.
- **Lần thứ hai:** cùng ca, cùng liên kết đã chập chờn ở Round 2, run `39074832961` (`rounds/round-02/qa/bug-list.md` mục 11.18, khi đó ghi "FE-B làm chắc sau").
- **Giả thuyết:** ca chạy axe ngay sau khi bảng tóm tắt được focus, **không chờ `document.fonts.ready`**.
  - Các ca landing khác có chờ: `layout.landing.spec.ts:119`, `lp-v2.landing.spec.ts`.
  - Kích thước vùng chạm của liên kết ở 375 px có thể đổi theo lúc font web thay font dự phòng.
  - Chưa xác nhận bằng trace.
- **Việc tiếp:**
  - QA sửa ca trong lượt sửa ca kế tiếp (chỉ test): chờ `document.fonts.ready` trước `axeViolations`.
  - Sửa rồi mà còn đỏ lần ba thì mở thẻ cho FE-LP về vùng chạm của liên kết số điện thoại ở 375 px.
  - Không chặn tag v1.0.5. Job landing đỏ thì chạy lại job, ORC ghi chú.

---

## 6. Đề xuất dòng decision-log (QA tự quyết – kết luận kiểm thử)

| Ngày | Round | Quyết định | Người quyết | Căn cứ |
|---|---|---|---|---|
| 2026-11-07 | 5 | QA kiểm lại PR #97 (MOB V5-15 Báo cần dọn) @ 3cc9c1e6 (nội dung f6a5b7f6): DUYỆT CÓ ĐIỀU KIỆN – tệp PR 27/27, bộ mobile 193/193, tsc 0, đột biến 12/12 chết (M4 cũ nay chết), gộp thử main b77508f3 không xung đột; FB-R5-QA-MOB-97-01 và 97-02 Closed; ca UXD "Dọn xong căn có khách, chờ 11 giây" đạt ở vitest và Chromium 375 px (nút về thân màn, không đè chỗ Dọn xong); che dữ liệu 3 ảnh MOB đạt. Điều kiện: CI 3cc9c1e6 xanh gồm E2E; staging TC-V105-15-01…14. Ghi chập chờn: landing TC-LP-015 375 px EN target-size lần 2 (run 42277411944), QA sửa ca chờ fonts.ready. Không ESC | QA | Quyền QA (kết luận kiểm thử) |
