# ARC review – PR #77 BUG-R4-039 phía Desk: không có ngoại lệ "buồng chưa sẵn sàng" khi căn còn khách (P1)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Đối tượng: `v104/fe-checkin-occupied` @ **`99d2c01b`** (ORC giao lại 05/11). Lần review đầu ở `a44bd5ed`. Ba commit:
  - `a44bd5ed`: mã, mock, test, chữ; cắt từ `217afac0`;
  - `ce859f59`: chữ UXD cho `checkin.room_occupied`/`room_held`;
  - `99d2c01b`: gộp `origin/main` `476fd9b8`.
  - Đọc bằng `git diff 217afac0 a44bd5ed` và `git diff a44bd5ed 99d2c01b`.
- Tệp trong PR (8):
  - `CheckInPage.tsx`, `mocks/stay.ts`;
  - test mới `__tests__/bug-r4-039-fea.test.tsx` (6 ca);
  - `design/tools/gen_strings.py` và các tệp sinh ra (`strings-vi.json`, `strings-en.json`, `strings-tables.md`, `wireframes/assets/strings.js`).
- Đọc kèm:
  - review #74 của ARC `rounds/round-04/reviews/ARC-on-v104-pr74-checkin-occupied.md`;
  - #74 @ `9646029d` (`checkin.service.ts`);
  - `openapi.yaml` (`checkIn` 409, `CheckInPreview`, bảng mã `ROOM_OCCUPIED`);
  - DOM lượt 5 mục 2;
  - `.github/workflows/ci.yml` (bước "Copy is generated").
- ARC tự chạy: **chỉ** `bug-r4-039-fea` (theo ORC, máy tải nặng), trong worktree tạm, đã xóa khi xong.

## Phán quyết (head `99d2c01b`): **ĐẠT CÓ ĐK**

Phần logic đúng hợp đồng #74:
- mọi điều khiển ngoại lệ (ô lý do, "Gửi xin duyệt", chip "đã duyệt", lọc `blocking`, `roomNotReadyOverride` gửi đi) theo `overridableBy`, không theo `detail`;
- căn không có ngoại lệ thì chặn cứng, không ô lý do, không nút duyệt;
- tương thích hai chiều với API cũ và mới (mục 2).

**Điều kiện gộp #77**:
- **C1 – FB-R4-ARC-FE-PR77-01**: gộp `main` và sinh lại chữ → **đã làm ở `99d2c01b`**.
  - ARC đã kiểm: PR nay `MERGEABLE`; `gen_strings.py` chạy lại không đổi gì (3474 chuỗi).
  - **Còn lại: CI xanh trên `99d2c01b`.** Lúc ARC xem, mọi job còn `pending`. Đây là lần CI đầu tiên của PR.
- **C2 – UXD duyệt chữ** → **đã làm ở `ce859f59`** (UXD FB-PR77-01): thêm "mời khách chờ", bỏ "Không ai xác nhận ngoại lệ được", câu `room_held` không nhắc buồng phòng. Đúng DOM lượt 5.

**Phụ thuộc #74 (không chặn gộp #77, vì tương thích hai chiều)**:
- Review #74 yêu cầu hai thay đổi chạm Desk. FE theo sau ngay khi #74 có (FB-R4-ARC-FE-PR77-02):
  - (C1 #74) lượt quá ngày đi chưa B18 cũng bỏ ngoại lệ `VD`/`CL`;
  - (C2 #74) điều kiện `room_ready` trả `cause` + `heldByReservationCode`.
- Nếu #74 đi phương án dự phòng (không có `cause`), #77 chỉ cần sửa mock theo C1 và chặn trường hợp đơn chưa có căn.

## 1. Kiểm lại bằng chạy thật

| Lần chạy | Kết quả | Ghi chú |
|---|---|---|
| `bug-r4-039-fea` trên head `a44bd5ed` | **6 passed (6)** | |
| Đảo `CheckInPage.tsx` + `mocks/stay.ts` về `217afac0`, giữ test + chữ | **5 failed, 1 passed** | Khớp số FE báo. Ca đối chứng "VD, căn trống" xanh, đúng vì hành vi đó không đổi |
| Trang **mới** + mock **cũ** (giả lập API chưa có #74) | **4 failed, 2 passed** | 4 ca chặn đỏ vì trang hiện ô ngoại lệ như hôm nay: API cũ vẫn trả `overridableBy` cho `OC`/`OD`. Đây là bằng chứng "API cũ + Desk mới = như hôm nay" |
| `gh pr checks 77` | **no checks reported** | PR xung đột nên GitHub không dựng được ref gộp; chưa có CI (C1) |
| `git merge-tree origin/main a44bd5ed` | Xung đột: `strings-en.json`, `strings-vi.json`, `gen_strings.py`, `strings-tables.md`, `strings.js` | Do #70 (nhóm chữ FE-B) đã vào `main`. Không chạm `CheckInPage.tsx`/`mocks/stay.ts` |
| **Head mới `99d2c01b`** – `git diff a44bd5ed 99d2c01b -- product/apps` | Chỉ `pages/booking/BookingDialog.tsx` và `__tests__/v104-booking-rate-carryover.test.tsx`. Cả hai **trùng hệt `main`** (diff với `origin/main` = 0 dòng), tức đến từ #70 qua lần gộp | `CheckInPage.tsx`, `mocks/stay.ts`, `bug-r4-039-fea.test.tsx`: **0 dòng khác** so với `a44bd5ed`. Phần FE-A tự viết thêm chỉ là chữ (`ce859f59`: 5 tệp chữ, 13/13 dòng) |
| `git diff origin/main 99d2c01b` | 8 tệp, đúng phạm vi PR: 3 tệp FE + 5 tệp chữ (+2 khóa mỗi JSON) | Không mang theo gì lạ |
| `git merge-tree origin/main 99d2c01b` | **Sạch**. `gh pr view`: `MERGEABLE` | |
| `python3 gen_strings.py` trên `99d2c01b` | "3474 strings + 8 templates", `git diff` = **0 dòng** | Bước CI "Copy is generated" sẽ qua |
| `bug-r4-039-fea` trên `99d2c01b` | **6 passed (6)** | Chạy lại vì chữ đổi, test đọc chữ qua `tv()` |
| `gh pr checks 77` @ `99d2c01b` | 8 job **pending** | C1 còn chờ |

## 2. Bốn câu ORC hỏi

**(1) Mock có khớp #74 không → khớp `9646029d` về hành vi. Hai chỗ xấp xỉ chấp nhận được; phải theo C1/C2 của #74.**

| #74 `checkin.service.ts` | Mock `stay.ts` | Kết luận |
|---|---|---|
| `met = room && !held && VI/VC` | `met: !held && (VI \|\| VC)` | Khớp |
| `overridableBy` chỉ khi `room && !held && VD/CL` | `...(overridable ? { overridableBy } : {})`, `overridable = !held && (VD \|\| CL)` | Khớp `9646029d`. **Sau C1 #74**: `overridable` phải bỏ ngoại lệ cả khi còn lượt quá ngày đi (bỏ `x.departureDate >= today()` ở nhánh `overridable`, giữ ở nhánh `met`) |
| `held`: `inRoomOnSql(D)` + `to_date >= D`, khác gốc | `in_house`, khác gốc, cùng `roomId`, `departureDate >= today()` | Xấp xỉ theo đơn, không theo đoạn ở (mock không có đổi phòng/đoạn). Đủ cho test Desk |
| B9: ghi đè chỉ khi `c.overridableBy`; nhánh 202 chỉ khi có `overridableBy`; yêu cầu đã duyệt không mở được căn không có `overridableBy` | `asksLead` và bộ lọc `unmet` dùng `!!c.overridableBy?.length` | Khớp |
| `detail` chỉ khi `!met` | `detail` luôn có | Lệch nhỏ, vô hại: trang chỉ đọc `detail` khi `!met` |
| Không có căn: `detail` mặc định `VC` | Không có căn: `status = 'VC'` | Khớp, nhưng cả hai đều sai nghĩa (mục 3, thẻ 03) |

**(2) API cũ + Desk mới, và ngược lại → cả hai chiều an toàn.**
- **API cũ** (chưa #74) **+ Desk mới**: API cũ trả `overridableBy` cho mọi `met:false` trừ `OOO`, nên `roomOverridable` đúng ở `OC`/`OD`/`VD`/`CL`. Desk hiện ô ngoại lệ **như hôm nay**. `OOO` vẫn đi nhánh `ooo` trước. ARC đã chạy: trang mới + mock cũ cho đúng hành vi cũ.
- **API mới + Desk cũ**: Desk cũ hiện ô lý do ở `OC`/`OD` rồi nhận 409 `CHECKIN_CONDITIONS_NOT_MET`. An toàn, vì máy chủ chặn, nhưng là ngõ cụt. Vì vậy #77 phải lên cùng v1.0.4.
- Thứ tự gộp #74/#77 **không bắt buộc**.

**(3) Không bao giờ gửi ghi đè khi vắng `overridableBy` → đúng.**
- `roomNotReadyOverride` chỉ có khi `roomApproved` hoặc `roomOverridable && roomReason`. Mà `roomApproved = !lead && approved && roomOverridable`.
- `requestOnly` cũng cần `roomOverridable`.
- Khi `!roomOverridable`, ô lý do không được dựng: nhánh `Alert` đứng trước `roomApproved` và ô lý do. Lý do đã gõ từ trước (ví dụ căn vừa `VD` thành `OC` sau khi đọc lại) cũng không được gửi.
- Test ca 2 đếm request `check-in` = 0.

**(4) `strings.js` xung đột với `main` → FE phải gộp `main` trước → đã làm (`99d2c01b`).** Ở `a44bd5ed` cả 5 tệp chữ đều xung đột, không chỉ `strings.js`. FE-A lấy các tệp sinh ra của `main` rồi sinh lại từ `gen_strings.py`. Đó là cách đúng. ARC chạy lại bộ sinh: không đổi gì.

## 3. Có nên để #74 trả lý do tường minh không → **có** (review #74, C2). #77 đổi ít

Cách đọc của DOM (`detail` `OC`/`OD` → `room_occupied`, khác → `room_held`) đúng trên `9646029d`, trừ **đơn chưa có căn**: máy chủ và mock trả `detail:"VC"` mặc định, nên Desk sẽ hiện `room_held` với `{room}` rỗng. Nhưng cách đọc này dựa vào chỗ *vắng* một trường, và không cho biết đơn nào giữ căn.

ARC quyết ở review #74:
- `room_ready` thêm `cause` (`room_status` | `held_by_other_stay` | `no_room`; ưu tiên `held_by_other_stay`);
- thêm `heldByReservationCode` (mã đơn gốc);
- `detail` giữ là trạng thái buồng.

Khi #74 có hai trường đó, #77 đổi:
- `roomBlockedText`:
  - có `cause` thì `held_by_other_stay` → `checkin.room_held`; `room_status` + `OC`/`OD` → `checkin.room_occupied` (đúng nghĩa "trạng thái lệch, nhờ buồng phòng");
  - không có `cause` (API cũ hoặc dự phòng) thì giữ cách đọc DOM;
  - `no_room`, hoặc không có số căn → không dựng `Alert` này (điều kiện `not_unassigned` đã báo);
- mock: thêm `cause`, `heldByReservationCode`; `overridable` theo C1 #74.
- Nên có (không bắt buộc cho v1.0.4): khi có `heldByReservationCode`, `Alert` thêm liên kết tới đơn đang giữ căn. DOM đặt "Trả phòng đơn trước" là việc đầu. Có thể thêm `{code}` vào câu `room_held` (UXD).

Kiểu `CheckInCondition` của `api-client` chỉ có `cause` sau khi #74 sinh lại client. Vì vậy:
- #74 vào trước: #77 rebase rồi dùng trường có kiểu;
- #77 vào trước: bản theo sau đổi `roomBlockedText` và mock.

## 4. Điểm khác
- **Nhánh 409 `ROOM_OCCUPIED`** (dòng ~1018) và test ca 6: `checkIn` **không bao giờ** trả `ROOM_OCCUPIED`. Hợp đồng 409 của `checkIn` chỉ có `CHECKIN_CONDITIONS_NOT_MET` / `RESERVATION_UNASSIGNED` / `INVALID_TRANSITION` / `SURCHARGE_CHANGED` / `ROOM_UNAVAILABLE`; `ROOM_OCCUPIED` là mã của khóa phòng. Nhánh và test đang kiểm một đường không có. Đường thật là "xem trước còn ngoại lệ, lúc ghi máy chủ trả `CHECKIN_CONDITIONS_NOT_MET`" (lượt khác vừa vào căn, hoặc buồng vừa đổi). Đường đó đã được trang xử lý đúng: `preview.reload()` khi lỗi, nên dòng `room_ready` hiện `Alert` chặn. Nhưng chưa có test (thẻ 03).
- Liên kết `drawer.action.move` → trang của **chính đơn này** (đổi căn/đổi ngày): đúng lối ra thứ hai của DOM.
- Chữ (bản UXD `ce859f59`): tiếng Việt nội bộ, không emoji, theo DOM lượt 5. Câu `room_held` ("còn đơn khác đang ở") vẫn đúng khi #74 thêm `cause`; nếu thêm `heldByReservationCode` thì UXD chèn `{code}`. Cột RU để trống, chấp nhận được với chữ Desk nội bộ.

## Thẻ feedback

### FB-R4-ARC-FE-PR77-01
- Mức độ: Major
- Vị trí: `product/design/tools/gen_strings.py` và 4 tệp sinh ra; nhánh `v104/fe-checkin-occupied`
- Vấn đề: PR xung đột với `main` (#70 đã thêm nhóm chữ FE-B ở cùng chỗ), nên GitHub không chạy CI. Bằng chứng xanh duy nhất là chạy máy cục bộ.
- Vì sao quan trọng: không gộp được. Gộp tay các tệp sinh ra sẽ đỏ bước "Copy is generated" hoặc mất chữ của #70.
- Đề xuất sửa:
  - `git merge origin/main` vào nhánh;
  - `gen_strings.py`: giữ cả hai nhóm;
  - chạy `python3 product/design/tools/gen_strings.py`;
  - commit các tệp sinh ra;
  - chờ CI xanh (gồm `admin-web` test và bước chữ).
- Trạng thái: Đã sửa ở `99d2c01b` (ARC kiểm lại: `MERGEABLE`, bộ sinh không đổi gì). Chờ CI xanh rồi đóng.

### FB-R4-ARC-FE-PR77-02
- Mức độ: Major (theo sau #74)
- Vị trí: `mocks/stay.ts` `roomHeldByAnotherStay`/`conditions`; `CheckInPage.tsx` `roomBlockedText`
- Vấn đề: review #74 đổi hai điểm Desk phải theo:
  - C1: lượt quá ngày đi chưa B18 cũng bỏ ngoại lệ `VD`/`CL`;
  - C2: thêm `cause`, `heldByReservationCode`.
- Vì sao quan trọng:
  - mock lệch máy chủ thì demo và e2e trên mock hiện ngoại lệ mà máy chủ từ chối;
  - câu chặn cần `cause` để không đoán sai (đơn chưa có căn) và để chỉ đúng đơn cần trả phòng.
- Đề xuất sửa: theo mục 3, sau khi #74 có C1/C2. Thêm một ca test "căn chỉ còn lượt quá ngày đi, buồng `CL`" → chặn, `room_held`.
- Trạng thái: Open

### FB-R4-ARC-FE-PR77-03
- Mức độ: Minor
- Vị trí: `CheckInPage.tsx` nhánh `act.code === 'ROOM_OCCUPIED'`, `roomBlockedText`; `bug-r4-039-fea.test.tsx` ca 6
- Vấn đề:
  - nhánh `ROOM_OCCUPIED` là mã `checkIn` không bao giờ trả, nên test ca 6 kiểm đường không có;
  - đường thật (409 `CHECKIN_CONDITIONS_NOT_MET` sau khi xem trước còn ngoại lệ) chưa có test;
  - đơn chưa có căn → `room_held` với số căn rỗng.
- Vì sao quan trọng: mã chết mang một giả định sai về hợp đồng. Lần sửa sau dễ dựa vào nó.
- Đề xuất sửa:
  - bỏ nhánh `ROOM_OCCUPIED` (hoặc ghi rõ là phòng xa, không có trong hợp đồng);
  - thay ca 6 bằng: xem trước `VD` có ngoại lệ, lễ tân trưởng gõ lý do, `failNext` 409 `CHECKIN_CONDITIONS_NOT_MET` `unmet:[room_ready]` + mock đổi căn sang còn lượt khác → sau khi đọc lại hiện `room_held`, ô lý do biến mất;
  - không dựng `Alert` chặn khi đơn chưa có căn.
- Trạng thái: Open

## Điểm làm tốt (nên giữ)
- Một cờ `roomOverridable` cho cả 5 chỗ trước đây dùng `!ooo`: hiển thị, `requestOnly`, `roomApproved`, `blocking`, thân gửi đi. Không còn chỗ nào tự suy theo trạng thái buồng.
- Test qua trang thật với MSW: ca "FD có yêu cầu đã duyệt hôm nay" đếm request để chứng minh không gửi gì. Có ca đối chứng `VD` căn trống cho cả lễ tân trưởng lẫn FD.
- Mock sửa cùng PR, nên demo không lệch máy chủ.

## Quyết định ARC – dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | #77 @ `99d2c01b` gộp độc lập với #74 (không bắt buộc thứ tự) khi CI xanh (đã gộp `main`, sinh lại chữ, UXD duyệt chữ). Desk theo `cause` của #74 khi có, thiếu thì đọc như DOM lượt 5 | ARC | Đã chạy: Desk mới trên API cũ = như hôm nay; API mới trên Desk cũ an toàn (409) |
