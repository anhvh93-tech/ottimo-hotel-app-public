# ARC review – PR #79 BUG-R4-039 Desk: đọc `cause` / `heldByReservationCode`, mock theo C1, bỏ nhánh `ROOM_OCCUPIED`

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Đối tượng: `v104/fe-checkin-cause` @ `b5fd9bd3`, PR xếp chồng trên `v104/fe-checkin-occupied` (#77 @ `99d2c01b`). Hai commit:
  - `742cb8a9`: đọc `cause`, mock C1, bỏ nhánh `ROOM_OCCUPIED`;
  - `b5fd9bd3`: chữ UXD lượt 4 (đuôi `room_occupied`, khóa mới `room_status_stuck`).
  - Đọc bằng `git diff 99d2c01b b5fd9bd3`.
- Tệp (8): `CheckInPage.tsx`, `mocks/stay.ts`, `bug-r4-039-fea.test.tsx`, `gen_strings.py` và 4 tệp chữ sinh ra.
- Đọc kèm:
  - review #74 (phụ lục A.2, A.4) và #77 của ARC;
  - #74 lượt 2 @ `0950313e`: `checkin.service.ts`, `openapi.yaml`, `api-client` sinh lại;
  - `UXD-on-v104-pr77-checkin-occupied.md` lượt 3–4.
- ARC tự chạy: **chỉ** `bug-r4-039-fea` (theo ORC), trong worktree tạm, đã xóa khi xong.

## Phán quyết (head `b5fd9bd3`): **ĐẠT CÓ ĐK**

Đúng cả bốn điểm ORC hỏi:
- tên trường và giá trị trùng phụ lục A.2 và trùng máy chủ #74 `0950313e`;
- mock theo C1;
- tương thích ba đời API;
- không bao giờ gửi ghi đè khi vắng `overridableBy`.

Không có thẻ Blocker/Major.

**Điều kiện (một)**: PR không chạy CI riêng ("no checks reported": base không phải `main`), nên bằng chứng CI đến qua #77 sau khi gộp #79 vào nhánh đó. Job `format · lint · audit · test · build` của #77 phải xanh.
- Lần chạy hiện tại của #77 đỏ **chỉ** ở `v104-holds-feb.test.tsx`, 2 ca "Hôm nay" giữ chỗ chạy ban đêm.
- `main` `476fd9b8` đỏ đúng 2 ca đó, cùng thông báo. Lỗi không do #77/#79. #76 (`v104/fe-holds-feb-pin-daytime`, chỉ sửa test) gỡ lỗi này.
- #76 đã vào `main` ở `7f0ef3fb` (17:58Z 04/11), **sau** lần chạy của #77 (17:35Z).
- Bấm chạy lại job thì không đủ. Theo tài liệu GitHub, lần chạy lại dùng lại `GITHUB_SHA` của sự kiện cũ, tức commit gộp chưa có #76.
- Cần một lần đẩy mới lên #77 (gộp #79 và `main` ≥ `7f0ef3fb`), rồi job xanh.

**Đổi kiểu `RoomReadyCondition` → không cần trước khi ĐẠT.**
- `api-client` của #74 `0950313e` sinh `cause?: 'room_status' | 'held_by_other_stay' | 'no_room'` và `heldByReservationCode?: string`.
- Kiểu tạm của #79 (`cause?: string`) giao với kiểu sinh vẫn biên dịch được, trước và sau khi #74 vào `main`.
- Tên trường đã khớp (mục 1), nên không còn rủi ro lệch im lặng.
- Bỏ kiểu tạm ở lần rebase đầu tiên sau khi #74 vào `main` (thẻ 02), để `tsc` canh tên trường về sau.

## 1. Tên trường và giá trị – so phụ lục A.2 và máy chủ #74 `0950313e`

| Điểm | A.2 / A.4 | Máy chủ `0950313e` | #79 (trang + mock) | Kết luận |
|---|---|---|---|---|
| Tên trường | `cause`, `heldByReservationCode` | Như A.2. `openapi-schemas.ts` thêm cả hai, nên serializer không bỏ | `RoomReadyCondition` đọc đúng hai tên | Khớp |
| Giá trị `cause` | `room_status` \| `held_by_other_stay` \| `no_room` | `RoomReadyCause` cùng 3 giá trị; client sinh union cùng 3 giá trị | `roomBlockedMessage` xét đúng 3 chuỗi | Khớp |
| Ưu tiên | `held_by_other_stay` trước, dù buồng `OC`/`OD` | `holder ? held_by_other_stay : room_status`; `no_room` khi không có căn | `held_by_other_stay` xét trước `room_status`; test "OC + lượt khác" ra `room_held_code` | Khớp |
| `heldByReservationCode` | mã đơn **gốc**, chỉ khi bị giữ | `JOIN reservation root … COALESCE(parent, id)`. Lượt đi hôm nay/phủ đêm nay xếp trước lượt quá ngày đi | Hiện mã trong `<Code>` (mono, JetBrains Mono theo brand); không có mã thì `room_held` | Khớp |
| Đơn chưa có căn | không `detail` | `...(room ? { detail } : {})`, `cause: 'no_room'` | `no_room` → không câu. Không có `cause` thì cần `not_unassigned` đạt **và** có số căn | Khớp. Sửa lỗi "báo nhầm căn còn khách" của #77 |
| `roomStatus` cấp trên | không đổi | vẫn trả (mặc định `VC` khi chưa có căn) | trang không dùng `roomStatus` để chọn câu | Không ảnh hưởng |

`operationId`: BE ghi `previewCheckIn` trong mục (l), thay cho `getCheckInPreview` của A.3. BE đúng: A.3 của ARC ghi sai tên.

## 2. Mock so với C1 (A.4, A.5) và máy chủ

| Máy chủ `0950313e` | Mock `stay.ts` | Kết luận |
|---|---|---|
| `holder` = lượt `in_house` khác gốc theo `inRoomOnSql(D)` nguyên (kể cả quá ngày đi) | `roomHolder`: `in_house`, khác gốc, cùng `roomId`, **không** lọc ngày đi | Khớp C1 |
| Nhiều lượt giữ: không quá hạn trước (`ORDER BY overdue, from_date, root.code`) | `held.find(departureDate >= today) ?? held[0]` | Khớp ý. Thứ tự phụ khác nhau chỉ khi có ≥ 2 lượt cùng loại, không có trong dữ liệu mock |
| `met = room && !heldToday && VI/VC` (v1.0.4: lượt quá hạn không làm `VI`/`VC` chưa đạt) | `ready = room && !(holder && !holder.overdue) && VI/VC` | Khớp |
| `overridableBy` chỉ khi `room && !holder && VD/CL` | `overridable = room && !holder && VD/CL` | Khớp |
| `cause` + `heldByReservationCode` chỉ khi `!met` | như máy chủ | Khớp |
| `detail` chỉ khi `!met` và có căn | `detail` khi có căn, cả lúc `met` | Lệch nhỏ, vô hại (đã ghi ở review #77): trang chỉ đọc `detail` khi `!met` |
| B9: ghi đè và nhánh 202 chỉ khi có `overridableBy` | Không đổi so với #77 (đã khớp) | Khớp |

## 3. Tương thích hai chiều (ba đời API)

| API | Desk | Hành vi | Bằng chứng |
|---|---|---|---|
| Cũ, chưa #74 (`overridableBy` cho mọi `met:false` trừ `OOO`) | #79 | `roomBlockedMessage` trả `null` ngay khi có `overridableBy`; ô ngoại lệ hiện **như hôm nay**; `OOO` vẫn `ci.ooo_never` | Mã (dòng đầu `roomBlockedMessage`). ARC chạy trang #79 + mock của `main`: 9 ca chặn đỏ, **chỉ** loại "không tìm thấy Alert chặn" (`expected undefined to be defined`), nghĩa là trang hiện ngoại lệ như cũ. Không có lỗi chạy. Ca đối chứng xanh |
| #74 `9646029d` (có chặn, chưa `cause`) | #79 | Theo cách đọc DOM, có chặn `not_unassigned` đạt + có số căn | ARC chạy trang #79 + mock của #77: 2 ca "server before #74 C2" và ca đối chứng **xanh**; 7 ca đỏ là các ca khẳng định câu theo `cause`, đúng dự đoán |
| #74 `0950313e` (C1 + C2) | #79 | Câu theo `cause`, tên đơn giữ căn | `bug-r4-039-fea` **13/13** trên head, mock theo máy chủ `0950313e` |
| #74 `0950313e` | #77 không #79 | Cách đọc DOM. Đơn chưa có căn → `room_held` với số căn rỗng (máy chủ mới bỏ `detail`) | Lý do **#79 phải đi cùng #77 trong v1.0.4**, không tách |
| #74 bất kỳ | Desk trên `main` (chưa #77) | Ô lý do rồi 409, an toàn | Review #77 |

## 4. Không bao giờ gửi ghi đè khi vắng `overridableBy` → **đúng, #79 không chạm đường này**
- Diff #79 không đổi `roomOverridable`, `requestOnly`, `roomApproved`, `blocking`, `roomNotReadyOverride`. Các chỗ này vẫn như #77 (đã kiểm: cùng một cờ `overridableBy`).
- Nhánh mới `roomBlockedText && (<Alert …>)`: khi `null` (đơn chưa có căn) thì dòng `room_ready` không dựng gì. Ô lý do vẫn **không** được dựng, vì nhánh `!roomOverridable` đứng trước.
- Test ca "FD có yêu cầu đã duyệt hôm nay" vẫn đếm 0 request `check-in`.

## 5. Kiểm lại bằng chạy thật

| Lần chạy | Kết quả |
|---|---|
| `bug-r4-039-fea` @ `b5fd9bd3` | **13 passed (13)** |
| Trang #79 + mock #77 (giả lập #74 `9646029d`) | 7 failed / 6 passed – đỏ đúng các ca cần `cause`; ca "API trước C2" xanh |
| Trang #79 + mock `main` (giả lập API cũ) | 9 failed / 4 passed – mọi ca đỏ là "không có Alert chặn", tức hành vi cũ |
| `python3 gen_strings.py` @ `b5fd9bd3` | "3476 strings + 8 templates", `git diff` = 0 dòng |
| `git merge-tree origin/main b5fd9bd3` | sạch |
| `gh pr checks 79` | no checks reported (PR không nhắm `main`) |
| `gh pr checks 77` @ `99d2c01b` | 1 fail: `v104-holds-feb` 2 ca ban đêm – trùng lỗi của `main` `476fd9b8`; gỡ bằng #76, nay đã ở `main` `7f0ef3fb` |

Chữ (UXD lượt 4) không do ARC duyệt:
- `room_held_code`, `room_status_stuck`, đuôi mới của `room_occupied`;
- UXD đã so từng ký tự ở `UXD-on-v104-pr77-checkin-occupied.md`;
- tiếng Việt nội bộ, không emoji, mã đơn mono theo brand.

ARC ghi một điểm cho DOM/UXD, không phải thẻ:
- câu `room_status_stuck` bảo "báo quản lý để sửa trạng thái căn", đúng với v1.0.4 vì Desk/app buồng phòng chưa có nút "Cần dọn";
- máy chủ đã có thao tác `needs_cleaning` (`OC → OD`) cho FD/HK, nên v1.0.5 có thể thêm nút như UXD đã ghi.

## Thẻ feedback

### FB-R4-ARC-FE-PR79-01
- Mức độ: Suggestion
- Vị trí: `CheckInPage.tsx` `roomBlockedMessage` (hai dòng cuối)
- Vấn đề: hai trường hợp sau rơi xuống cách đọc DOM, nên có thể hiện "căn còn đơn khác" khi không có đơn nào:
  - `cause` lạ (giá trị máy chủ thêm sau này);
  - `cause = room_status` mà buồng không phải `OC`/`OD`. Hôm nay không đến được: `VD`/`CL` không lượt giữ thì có `overridableBy`, còn `OOO` đã lọc trước.
  - Mô tả A.2 ghi "tập mở: mã lạ → hiện câu chung".
- Vì sao quan trọng: thêm giá trị `cause` sau này (ví dụ ngày về căn cũ chưa ghi, thẻ #74 BE-04) sẽ hiện câu sai mà không test nào báo.
- Đề xuất sửa: chỉ dùng cách đọc DOM khi `cause` **vắng**. Có `cause` mà không khớp nhánh nào thì dùng một câu chung (UXD chọn khóa sẵn có, ví dụ "căn chưa sẵn sàng, không có ngoại lệ"). Thêm 1 ca unit. Có thể làm cùng thẻ 02.
- Trạng thái: Open

### FB-R4-ARC-FE-PR79-02
- Mức độ: Suggestion
- Vị trí: `CheckInPage.tsx` `type RoomReadyCondition`
- Vấn đề: kiểu tạm `cause?: string` không cho `tsc` canh tên trường và giá trị.
- Vì sao quan trọng: hôm nay đã khớp (mục 1), nhưng lần đổi hợp đồng sau sẽ không có chốt chặn.
- Đề xuất sửa: khi rebase sau #74 vào `main`, bỏ `RoomReadyCondition`, dùng `CheckInCondition` sinh từ `api-client`. Không cần trước khi gộp.
- Trạng thái: Open

## Điểm làm tốt (nên giữ)
- Tách `roomBlockedMessage` thành hàm thuần, có test unit cho từng nhánh: `cause` có/không có mã, `no_room`, không `cause`, `OOO`, điều kiện đạt. Thứ tự ưu tiên đọc được trong một chỗ.
- Có ca giả lập API trước C2 bằng `vi.spyOn` (xóa `cause` khỏi phản hồi thật của mock). Đường dự phòng được kiểm, không chỉ được hứa.
- Thay ca `ROOM_OCCUPIED` chết bằng đường thật: xem trước còn ngoại lệ, lượt khác vào căn, B9 409, đọc lại, chặn đúng câu.

## Quyết định ARC – dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | #79 ĐẠT CÓ ĐK: gộp vào #77, đi cùng #77 trong v1.0.4; điều kiện là CI của #77 xanh trên một lần đẩy mới có `main` ≥ `7f0ef3fb` (lỗi `v104-holds-feb` ban đêm là của `main`, #76 đã gỡ). Bỏ kiểu tạm khi rebase sau #74 | ARC | Khớp A.2 và máy chủ #74 `0950313e`; tương thích ba đời API (đã chạy); #77 một mình hiện sai câu cho đơn chưa có căn khi #74 C2 lên |
