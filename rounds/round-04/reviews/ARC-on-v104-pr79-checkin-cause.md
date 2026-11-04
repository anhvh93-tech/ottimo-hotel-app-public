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
- Lượt 3: #77 @ `055e92d5` (kiểu sinh thay kiểu tạm, sửa `tsc`), mục "Lượt 3" ngay dưới đây.
- Lượt 2: `d1a30cb7`, `0d209aed`, gộp vào #77 @ `5aca248e`.

## Lượt 3 (#77 @ `055e92d5`, 05/11): **ĐẠT** – không đổi hành vi, chờ CI

Kiểm ngắn theo ORC, chỉ đọc git, không chạy test.

Hai commit mới trên `5aca248e`:
- `5d74eb02` (ORC): gộp `main`, gồm #74 (`2f535924`) và #82, sinh lại chữ.
  - `CheckInPage.tsx` và `bug-r4-039-fea.test.tsx` giữ nguyên blob của `5aca248e`.
- `055e92d5` (FE-A): 2 tệp, +5/−6.

### L3.1 `CheckInPage.tsx` – chỉ đổi kiểu, không đổi hành vi
- Bỏ `type RoomReadyCondition = CheckInCondition & { cause?: string; heldByReservationCode?: string }`.
- `roomBlockedMessage(c: CheckInCondition | undefined, …)` nay dùng kiểu sinh từ `api-client`. Trên cây có #74, kiểu này có:
  - `cause?: 'room_status' | 'held_by_other_stay' | 'no_room'`;
  - `heldByReservationCode?: string`.
- Thân hàm không đổi một ký tự: thứ tự `OOO` → `no_room` → `held_by_other_stay` (có / không mã) → `room_status` + `OC`/`OD` → `!hasRoom` → cách đọc DOM.
- Không còn chỗ nào dùng `RoomReadyCondition` (`git grep` rỗng).
- Thẻ **FB-R4-ARC-FE-PR79-02: Fixed @ `055e92d5`**. `tsc` nay canh tên trường và giá trị `cause` theo hợp đồng.

### L3.2 Test – nhánh `cause` lạ vẫn được kiểm
- Ca unit `roomBlockedMessage({ ...base, detail: 'VI', cause: later }, true)` → `{ key: 'checkin.room_held' }` vẫn còn. Chỉ đổi cách đưa giá trị lạ vào: `const later = 'later_cause' as unknown as CheckInCondition['cause']`.
- Ép kiểu là cách đúng ở đây:
  - hợp đồng ghi `cause` là tập mở (A.2), nên Desk cũ sẽ gặp giá trị mới ở lúc chạy;
  - kiểu sinh lại đóng (union 3 giá trị), nên chỉ test mới cần đưa giá trị ngoài union vào.
- Số ca trong `bug-r4-039-fea` không đổi (10 khối `it`, 13 ca như lượt 1).
- Số tệp test của `admin-web` từ 85 lên 86 (thêm `v104-rate-source-typed` của #82). Không tệp nào bị bỏ.
- Con số FE-A báo (158/158 trên 13 tệp) là một nhóm tệp FE-A chọn chạy, không phải cả bộ. CI chạy cả bộ.

**Sửa một câu của lượt 1:**
- Lượt 1 viết kiểu tạm "giao với kiểu sinh vẫn biên dịch được". Câu đó đúng với trang.
- Nhưng giao `string` với union 3 giá trị cho ra chính union đó, nên chuỗi lạ `'later_cause'` trong test thành lỗi TS2322 khi #74 vào. Đó là lỗi CI run 41899315135 mà `055e92d5` sửa.
- Không có hành vi nào sai. Chỉ `tsc` của test đỏ.

### L3.3 CI và thẻ
- #77 run 41900426878 @ `055e92d5`:
  - 4 job xanh: API contract, Redocly, confidential, no test endpoints;
  - `format · lint · audit · test · build`, shellcheck, landing, gitleaks đang chạy.
- Cây có #74 và #76.
- FB-R4-ARC-FE-PR79-01 (Suggestion, `cause` lạ thì hiện câu chung): vẫn Open, v1.0.5. Ca test ở L3.2 sẽ là chỗ đổi khẳng định khi làm thẻ này.

**Phán quyết lượt 3: ĐẠT.** Gộp #77 khi job `format · lint · audit · test · build` của run 41900426878 xanh.

Dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi):

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | #77 @ `055e92d5` ĐẠT (lượt 3 của #79): dùng `CheckInCondition` sinh từ `api-client`, bỏ kiểu tạm; gộp khi CI run 41900426878 xanh | ARC | Thân `roomBlockedMessage` không đổi; ca `cause` lạ còn, giá trị lạ đưa vào bằng ép kiểu vì hợp đồng để tập mở; FE-PR79-02 đóng |

---

## Lượt 2 (#79 @ `fa80de85`, đã gộp vào #77 @ `5aca248e`, 05/11): **ĐẠT** – chờ CI #77

Kiểm ngắn theo ORC, chỉ đọc git, không chạy test. FE-A báo 160/160 trên 14 tệp test.

Hai commit mới sau `b5fd9bd3`, rồi hai lần gộp:
- `d1a30cb7`: ghi chú chữ theo UXD FB-R4-UXD-FE-PR79-01;
- `0d209aed`: mock `room_ready` theo #74 C2 @ `0950313e`;
- `fa80de85`: gộp #77 (`99f18ac2`, có `main`) vào #79;
- `5aca248e`: gộp #79 vào #77.

### L2.1 `d1a30cb7` – chỉ ghi chú, không đổi chữ hiển thị
- Đổi 3 dòng **ghi chú** trong `gen_strings.py` và `strings-tables.md`: `room_occupied`, `room_held`, `room_held_code`.
- Chữ vi/en của các khóa không đổi.
- Ghi chú nay tả đúng cách chọn câu của `roomBlockedMessage`:
  - `room_occupied` chỉ khi vắng `cause` (API trước C2) hoặc `cause` lạ, và đơn đã có căn;
  - `room_held` khi `held_by_other_stay` thiếu mã;
  - `room_held_code` khi có mã đơn gốc.
- Ghi chú ghi rõ "`cause` lạ thì dùng cách đọc DOM". Đó là hành vi mà thẻ FB-R4-ARC-FE-PR79-01 (Suggestion) đề nghị đổi. Ghi chú đúng với mã hiện tại; thẻ vẫn Open.

### L2.2 `0d209aed` – mock khớp hợp đồng (l) và máy chủ `0950313e`

| Điểm | Hợp đồng (l) / máy chủ | Mock sau `0d209aed` | Kết luận |
|---|---|---|---|
| `detail` | chỉ khi chưa đạt, vắng khi đơn chưa có căn | chuyển `...(room ? { detail } : {})` vào nhánh `!ready` | Khớp. Lệch nhỏ ARC ghi ở lượt 1 mục 2 nay đã hết |
| `cause`, `heldByReservationCode` | chỉ khi chưa đạt; mã là mã đơn gốc | không đổi, mã qua `rootCode` | Khớp |
| Thứ tự khi nhiều lượt giữ | `ORDER BY overdue, from_date, root.code` | `rank` = `quá hạn?` \| `arrivalDate` \| mã gốc, sắp xếp chuỗi | Khớp ý |
| `met`, `overridableBy` | C1 | không đổi | Khớp |

Ghi chú về thứ tự khi nhiều lượt giữ:
- Mock dùng ngày đến và ngày đi của **đơn**. Máy chủ dùng ngày của **đoạn** (`reservation_segment`).
- Hai bên chỉ lệch với đơn đổi căn giữa chừng có nhiều đoạn, và chỉ khi có ≥ 2 lượt cùng giữ một căn. Dữ liệu mock không có trường hợp này.
- Ngày dạng `YYYY-MM-DD` cùng độ dài, nên sắp xếp chuỗi đúng thứ tự ngày.
- Chấp nhận cho mock.

### L2.3 `CheckInPage.tsx` trên #77 @ `5aca248e` = #77 + #79, không mất gì
- Blob `CheckInPage.tsx` ở `5aca248e` **trùng hẳn** blob ở `b5fd9bd3`, bản ARC đã review ở lượt 1.
- Phía #77 (`99f18ac2`) vẫn là blob của `99d2c01b`. `main` không sửa tệp này kể từ đó (`git log 99d2c01b..99f18ac2 -- CheckInPage.tsx` rỗng).
- Vì #79 xếp chồng trên `99d2c01b`, bản ở `5aca248e` là đúng "#77 + #79", không có phần nào của #77 bị mất.
- Các tệp khác của #79 (gốc chung `99d2c01b`):

| Tệp | Kết quả |
|---|---|
| `bug-r4-039-fea.test.tsx`, `mocks/stay.ts` | trùng hẳn `0d209aed`; `main` không sửa |
| `strings-vi.json`, `strings-en.json`, `gen_strings.py`, `strings-tables.md` | đúng là hợp của hai bên, kiểm từng dòng |
| `wireframes/assets/strings.js` | tệp sinh một dòng. ARC đọc lại JSON trong tệp: vi và en mỗi bên 3486 khóa, trùng từng khóa và giá trị với `strings-*.json` ở `5aca248e`; có đủ `room_held_code`, `room_status_stuck`, `room_occupied`, `room_held` |

- `git diff fa80de85 5aca248e` rỗng: commit gộp vào #77 không thêm gì.
- `git merge-tree origin/main 5aca248e`: sạch.
- `5aca248e` có #76 (`7f0ef3fb`). Điều kiện lượt 1 ("đẩy mới có `main` ≥ `7f0ef3fb`") đã đạt.

### L2.4 CI và thẻ
- #77 run 41894172813 @ `5aca248e`: 5 job xanh (API contract, Redocly, confidential, gitleaks, no test endpoints). `format · lint · audit · test · build`, shellcheck, landing đang chạy. "Copy is generated" nằm trong job đầu.
- FB-R4-ARC-FE-PR79-01 (Suggestion): Open. Ghi chú UXD đã tả đúng hành vi hiện tại; đổi sang câu chung có thể làm ở v1.0.5.
- FB-R4-ARC-FE-PR79-02 (Suggestion): Open. Kiểu tạm `RoomReadyCondition` còn, như FE-A báo.
  - Làm ở lần gộp `main` đầu tiên của #77 sau khi #74 vào `main`.
  - Nếu #77 vào `main` trước #74 thì làm trong một PR nhỏ sau.
  - Không chặn.

**Phán quyết lượt 2: ĐẠT.** Gộp #77 khi job `format · lint · audit · test · build` của run 41894172813 xanh. Cây đã có #76, nên ca ban đêm `v104-holds-feb` không còn là lý do được chấp nhận.

Dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi):

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | #79 lượt 2 ĐẠT (gộp vào #77 @ `5aca248e`); #77 gộp được khi CI run 41894172813 xanh. Kiểu tạm `RoomReadyCondition` bỏ sau khi #74 vào `main` | ARC | Mock theo hợp đồng (l) và máy chủ `0950313e`; `CheckInPage.tsx` trùng bản đã review; chữ là hợp đúng, `strings.js` khớp JSON; cây có #76 |

---

## Lượt 1 – Phán quyết (head `b5fd9bd3`): **ĐẠT CÓ ĐK**

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
