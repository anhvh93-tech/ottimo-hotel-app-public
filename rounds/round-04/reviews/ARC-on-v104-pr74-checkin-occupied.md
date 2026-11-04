# ARC review – PR #74 BUG-R4-039: nhận phòng vào căn còn khách đang ở (ngoại lệ BR-402 (1)) (P1)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Lượt 3: head `71d0a1b1` (K1 bằng commit gộp `main`), mục "Lượt 3" ngay dưới đây.
- Lượt 2: head `0950313e` (C1 + C2 + chữ C3).
- Đối tượng lượt 1: `v104/fix-checkin-occupied-exception` @ `9646029d`. Hai commit trên `ea979fe7`:
  - `377411d1`: sửa mã, hợp đồng, oracle, test mới;
  - `9646029d`: dữ liệu test `reversal-debt-g4`.
  - Đọc bằng `gh pr diff 74` và thân PR.
- Tệp trong PR (6):
  - `checkin.service.ts`;
  - `openapi.yaml` + `api-client/src/generated/openapi.ts` (chỉ mô tả);
  - test mới `checkin-occupied-exception.test.ts` (4 ca);
  - `reversal-debt-g4.test.ts` (helper `childStay`);
  - `br-examples.json` (BR-402-03, BR-402-04).
- Đọc kèm:
  - `business-rules.md` BR-402 (1) v0.5.3 và v0.5.4 (DOM 05/11);
  - `DOM-on-v104-pr68-docs.md`, "DOM lượt 5" mục 2;
  - `housekeeping/public/stay-occupancy.ts` (`inRoomOnSql`);
  - `housekeeping/public/room-status.service.ts` (trạng thái suy ra, `arrivedToday`, `stayContinues`);
  - `housekeeping/internal/rules.ts` (`roomTarget` SM-03), `housekeeping/internal/attention-sources.ts` (`room_status_mismatch`);
  - `checkout.service.ts` (B18 đặt `VD`);
  - FE `CheckInPage.tsx` và mock `mocks/stay.ts` (PR không đổi);
  - #71 @ `02c34bc9`, `main` @ `da5c3c4c` (đã có #67, #73).
- ARC tự chạy trong worktree tạm, PostgreSQL riêng, máy tải ~50–70:
  - test của PR;
  - 1 ca dò tạm, không commit;
  - biến thể "chặt" của (b) trên toàn bộ `test/integration`, và biến thể v1.0.4 (C1) trên các tệp bị ảnh hưởng;
  - cây gộp thử `main` + #71 + #74.
  - Worktree và container đã xóa khi xong.

## Lượt 3 (head `71d0a1b1`, 05/11): **ĐẠT** – K1 xong, chỉ còn chờ CI

Kiểm ngắn theo ORC, chỉ đọc git, không chạy test.

Hai commit mới trên `0950313e`:
- `dbe82ee8`: QA2 rà oracle BR-402-05.
- `71d0a1b1`: gộp `main` @ `e7545203` vào nhánh. Hai cha là `dbe82ee8` và `e7545203`; cây gộp có #71 (`2c8cd8cf`), #80, #81, #76 (`7f0ef3fb`).

BE **gộp** chứ không rebase, vì force-push bị chặn. ARC chấp nhận cách này. Điều K1 cần là cây cuối đúng, client sinh trên cây đó, và CI chạy trên cây đó; ba điều này không phụ thuộc rebase hay gộp. Lịch sử có thêm một commit gộp, không ảnh hưởng gì.

### L3.1 Gỡ xung đột `openapi.yaml` – **đúng**
- `git show 71d0a1b1 -- product/docs/api/openapi.yaml` (diff gộp) chỉ có một khúc, ở danh sách 0.3.12:
  - (j) giữ nguyên;
  - (k) BUG-R4-038 của #71, nguyên chữ;
  - (l) BUG-R4-039 của #74, nguyên chữ;
  - rồi đến mục 0.3.11.
- Không còn dấu xung đột.
- ARC kiểm thêm rằng bản gộp đúng là **hợp của hai bên**, không mất hay thêm dòng nào:
  - (bản gộp − `main`) trùng từng dòng với (gốc chung `ea979fe7` → `dbe82ee8`), 20 dòng;
  - (bản gộp − #74) trùng từng dòng với (gốc chung → `main`), 39 dòng.

### L3.2 Diff ngoài hợp đồng và mã sinh – **chỉ có nội dung `main` và bản vá oracle**
`git diff 0950313e 71d0a1b1` (bỏ `**/generated/**`, `openapi.yaml`, `packages/api-client/**`) đổi 61 tệp.

**59 tệp trùng hẳn bản `main` `e7545203`.** Đó là nội dung `main` từ gốc chung `ea979fe7`, nhiều hơn #71/#80/#81, vì #74 tách từ `ea979fe7`:
- #67 (Desk BUG-R4-038, `packages/ui`);
- #70 (`BookingDialog`);
- #73 (giá niêm yết OTA);
- #71 (đêm thêm Nội bộ, phía máy chủ);
- #76 (`v104-holds-feb`);
- #80 (hạn giữ chỗ theo ngày địa phương);
- #81 (minibar, BUG-R4-042, chữ sinh lại);
- BR v0.5.6–v0.5.8 và 27 tệp review/log trong `rounds/`, `01-decisions/`.

Không có mã nào ngoài những gì đã ở `main`.

**2 tệp khác `main`, vì hai bên cùng sửa.** Cả hai là hợp đúng của hai bên (kiểm như L3.1):
- `checkin.service.ts`: 77 dòng của #74 và 56 dòng của #71.
- `br-examples.json`: phía #74 có BR-402-03/04/05 và bản vá `dbe82ee8`; phía `main` có các dòng của #71, #73.

Hai tệp test của #74 (`checkin-occupied-exception`, `reversal-debt-g4`) trùng hẳn bản `dbe82ee8`.

Bản vá oracle `dbe82ee8` chỉ sửa 2 dòng `br-examples.json`:
- `owner`: thêm "QA2 05/11: rà BR-402-04 và BR-402-05 trên `0950313e` – đúng; bỏ nhãn".
- BR-402-05 `qaAssumption`: bỏ "[GIẢ ĐỊNH QA]"; ghi "ngày giờ do BE chọn theo ca dò ARC", "buồng phòng (hoặc lễ tân) bấm Cần dọn và Bắt đầu dọn qua API buồng phòng", "Không đổi kết quả", "QA2 rà 05/11 … khớp mọi khóa expected".
- `expected` không đổi.

### L3.3 Mã sinh
- `api-client/src/generated/openapi.ts` và `services/api/src/generated/openapi-schemas.ts` đều là hợp đúng của hai bên.
- So với `main`, chỉ thêm phần của #74: `cause`, `heldByReservationCode` và chữ mô tả.
- BE báo đã chạy lại `gen` và `gen:openapi` trên cây gộp, không đổi gì.
- `api-client` có test lệch mã sinh (`src/generated.test.ts`, trong 37/37 BE báo), CI chạy lại test này.

### L3.4 K1 – **đạt bằng commit gộp**

| Yêu cầu K1 | `71d0a1b1` |
|---|---|
| Lên trên `main` có #71 | Có `2c8cd8cf` và `e7545203` |
| Gỡ (k)/(l): giữ cả hai, (k) trước | Đúng (L3.1) |
| Sinh lại client trên cây cuối | Hợp đúng; BE chạy lại không đổi; test lệch mã sinh canh |
| Có #76 để hết 2 ca ban đêm | Có `7f0ef3fb` |
| CI xanh trên lần đẩy đó | Run 41889899172 đang chạy. 6 job xanh, gồm API contract (`--strict`) và Redocly. `format · lint · audit · test · build` và landing đang chạy |

- Thẻ BE-PR74-03: Fixed @ `71d0a1b1`, chờ CI.
- Thẻ BE-PR74-01 và BE-PR74-02: giữ Fixed, chờ cùng lần chạy CI.
- Thẻ QA-PR74-01 (1): QA2 đã rà và bỏ nhãn. (2), truy vấn trước deploy, vẫn mở (R3).
- Thẻ DOM-PR74-02: chưa sửa. Chữ mới của BR-402-05 đã ghi "qua API buồng phòng", nên phần oracle đủ rõ. Phần câu BR v0.5.6 vẫn mở, ở mức Suggestion.

**Phán quyết lượt 3: ĐẠT.**
- Gộp được khi job `format · lint · audit · test · build` của run 41889899172 xanh.
- Nếu job đó đỏ, ORC gửi lại ARC tên ca đỏ. Cây đã có #76, nên ca ban đêm `v104-holds-feb` không còn là lý do được chấp nhận.
- Điều kiện phát hành R1 và R3 vẫn như lượt 2. R1: #77 + #79 lên cùng v1.0.4, CI #77 xanh trên lần đẩy mới. R3: truy vấn trước deploy.

Dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi):

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | #74 lượt 3 @ `71d0a1b1` ĐẠT: K1 làm bằng commit gộp `main` (không rebase, force-push bị chặn) được chấp nhận; gộp khi CI run 41889899172 xanh | ARC | Gỡ (k)/(l) đúng; các tệp hai bên cùng sửa (hợp đồng, `checkin.service.ts`, `br-examples.json`, 2 tệp sinh) là hợp đúng; 59 tệp còn lại trùng `main`; mã sinh hợp đúng và có test lệch mã sinh |

---

## Lượt 2 (head `0950313e`, 05/11): **ĐẠT CÓ ĐK**

BE đi đường C2, không dùng dự phòng mục 4.3. Đọc bằng `git diff 9646029d 0950313e`. ARC tự chạy test của PR trong worktree tạm, PostgreSQL riêng; worktree và container đã xóa khi xong.

**Còn một điều kiện gộp:**
- **K1**: rebase lên `main` sau khi #71 vào, gỡ xung đột (k)/(l) (mục L2.3), sinh lại `api-client` trên cây đã rebase.
- Job `format · lint · audit · test · build` của lần đẩy đó phải xanh.
- Lần đẩy đó tự có #76 (`main` `7f0ef3fb`), nên 2 ca ban đêm của `v104-holds-feb` không còn lý do đỏ.

C1, C2 và phần chữ của C3 đã xong. Không có thẻ Blocker/Major mới.

**Điều kiện phát hành:**
- R1 (#77 + #79) đã ĐẠT CÓ ĐK, chờ CI.
- R2 (DOM) xong ở BR v0.5.6.
- R3 (QA) còn mở.

### L2.1 C1 so với A.5 – **khớp**

| Điểm | Phụ lục | `0950313e` | Kết luận |
|---|---|---|---|
| Ai giữ căn | `inRoomOnSql(D)` nguyên, gồm lượt quá ngày đi | `roomHolder`: `inRoomOnSql('$3::date')`, không còn `AND s.to_date >= $3::date`; trả `{ code, overdue }` | Khớp |
| `overridableBy` | chỉ khi `room && !holder && VD/CL` | `roomOverridable = !!room && !holder && (VD \|\| CL)` | Khớp |
| `met` của `VI`/`VC` | giữ (b) của BE ở v1.0.4 | `heldToday = !!holder && !holder.overdue`; `roomReady = !!room && !heldToday && VI/VC` | Khớp. v1.0.5 đổi thành `!!holder` (thẻ 05) |
| Lệnh ghi dùng cùng cờ | xem trước và B9 cùng `overridableBy` | Không đổi so với `9646029d`. Chú thích B9 ghi rõ "kể cả lượt quá ngày đi" | Khớp |
| Chú thích và hợp đồng | A.1 | Bỏ câu "lượt quá ngày đi không tính ở bước này". Mô tả `checkIn` và `CheckInPreview.conditions[]` ghi: căn chỉ còn lượt quá ngày đi thì `VD`/`CL` không có `overridableBy` | Khớp |
| Test qua API buồng phòng | 2 ca: đi hôm nay + `CL`; quá ngày đi + `CL` | Ca 302 và 301, `POST /rooms/{id}/status-transitions` (`needs_cleaning`, `start_cleaning`), không dùng SQL. Mọi vai 409, không ghi gì | Khớp |

ARC chạy đảo bản vá (`roomOverridable` dùng `!heldToday` thay `!holder`, tức quay về (b) của BE):
- ca 301 đỏ: `expected [ 'front_desk_lead', 'manager', …(1) ] to be undefined`;
- 6 ca còn lại xanh, đúng dự đoán, vì ca 302 là lượt đi hôm nay, không quá hạn.
- Vậy ca 301 canh đúng lỗ C1, không phải test chỉ chạy qua.

### L2.2 C2 so với A.2 và A.4 – **khớp, thêm một điểm tốt**

| Điểm | Phụ lục | `0950313e` | Kết luận |
|---|---|---|---|
| `cause` | `room_status` \| `held_by_other_stay` \| `no_room`, tập mở | `type RoomReadyCause` cùng 3 giá trị; `openapi.yaml` có `enum` và chữ "tập mở"; client sinh union cùng 3 giá trị | Khớp |
| Ưu tiên | `no_room`, rồi `held_by_other_stay` (dù buồng `OC`/`OD`), rồi `room_status` | `!room ? 'no_room' : holder ? 'held_by_other_stay' : 'room_status'` | Khớp |
| `heldByReservationCode` | mã đơn **gốc**, chỉ khi có lượt giữ | `JOIN reservation root ON root.id = COALESCE(r.parent_reservation_id, r.id)`; chỉ thêm khi `holder` | Khớp |
| Nhiều lượt giữ | lượt chưa quá hạn đứng trước | `ORDER BY (s.to_date < $3::date), s.from_date, root.code` | Khớp. Thêm `root.code` làm thứ tự cuối, nên kết quả tất định (A.4 thiếu) |
| `detail` | vắng khi đơn chưa có căn | `...(room ? { detail: roomStatus } : {})` | Khớp. Ca mới "OTA chưa có căn": `cause: no_room`, không `detail`, không ngoại lệ |
| Serializer đóng | thêm vào `openapi-schemas.ts`, nếu không thì bị bỏ | Có `cause`, `heldByReservationCode` là trường đơn | Khớp. Test đọc qua HTTP thấy hai trường, nên serializer không bỏ |
| Khẳng định trong test | 4 ca cũ và 2 ca C1 | Ca 202/203/201 khẳng định `held_by_other_stay` và mã; ca `VD`/`CL` khẳng định `room_status` và không có mã; ca 301/302 khẳng định `held_by_other_stay` và mã gốc | Khớp |

### L2.3 C3 so với A.1 và A.3 – **phần chữ khớp; còn rebase**
- Không còn chữ "chờ ARC duyệt" ở mô tả `checkIn`/`previewCheckIn`.
- Mục (l) có trong danh sách 0.3.12, đúng chữ A.3, dùng `checkIn`/`previewCheckIn`.
  - Bản đầu A.3 của ARC ghi nhầm `getCheckInPreview`; BE dùng tên đúng.
  - ARC đã sửa A.3 và mục 3 (e) trong tệp này.
- `info.version` giữ `0.3.12-draft`.
- `api-client` sinh lại trên cây hiện tại, có `cause`/`heldByReservationCode`.
- **Còn lại (K1):**
  - `git merge-tree origin/main 0950313e` (`main` `7f0ef3fb`): sạch.
  - `git merge-tree` #71 `5045c2de` với `0950313e`: **xung đột 1 tệp**, `docs/api/openapi.yaml` dòng 334–345, đúng chỗ (k) của #71 và (l) của #74.
  - Cách gỡ: giữ cả hai, (k) trước, (l) sau.
  - `openapi.ts` sinh ra tự gộp được về mặt chữ, nhưng vẫn phải chạy lại `gen.mjs` trên cây đã rebase, không tin bản tự gộp.
  - #71 vẫn mở (head `5045c2de`). Thứ tự gộp mục 6 không đổi.

### L2.4 #79 đọc `cause` và `heldByReservationCode` có khớp máy chủ không – **khớp**
- Cùng tên trường, cùng 3 giá trị.
- `heldByReservationCode` là mã gốc: Desk hiện mã đó, lễ tân tìm được đơn để trả phòng.
- Đơn chưa có căn: máy chủ bỏ `detail` và trả `cause: no_room`. #79 không hiện câu chặn, đúng ý FB-R4-ARC-FE-PR77-03 (không chặn khi chưa có căn).
- Mock `stay.ts` của #79 dựng `holder` theo cùng định nghĩa (gồm lượt quá hạn, lượt chưa quá hạn đứng trước). `met` và `overridableBy` theo đúng công thức C1.
- Chi tiết và ba đời API: `ARC-on-v104-pr79-checkin-cause.md` (ĐẠT CÓ ĐK).
- Một gợi ý còn mở ở đó: `cause` lạ thì hiện câu chung (FB-R4-ARC-FE-PR79-01, Suggestion). Hợp đồng đã ghi "tập mở", nên thêm giá trị sau này không phá Desk, chỉ có thể hiện câu kém chính xác.

### L2.5 Sửa một điểm của lượt 1: không có nút "Cần dọn" ở v1.0.4
- Lượt 1 viết "buồng phòng bấm Cần dọn (R8a) rồi Bắt đầu dọn", như hai nút trên giao diện. Thực tế:
  - app buồng phòng v1.0.4 chỉ gửi `start_cleaning` và `finish_cleaning`;
  - `needs_cleaning` có trong kiểu `RoomEvent` của `apps/mobile` nhưng không màn nào gửi;
  - Desk không có nút này;
  - máy chủ cho `needs_cleaning` với OWN/MGR/FDL/FD/HK (x-roles), nên đường API vẫn mở. Ca dò ARC và ca 301 của BE đi đường này.
- Đường trên giao diện: căn đã ở `OD` (ví dụ việc dọn ở lại của một đêm trước chưa làm, J8 đã đặt `OD`). Ngày khách mới đến, buồng phòng thấy căn trong bộ lọc "Cần dọn", bấm "Bắt đầu dọn", căn thành `CL`.
  - J8 không đặt `OD` cho lượt **đã** quá ngày đi (`stayoverNightSql` cần `to_date > D`), nên đường này cần căn đã `OD` từ trước.
- Kết luận không đổi:
  - lỗ C1 đến được bằng thao tác bình thường, qua API hoặc qua căn `OD` sẵn;
  - BR-402 cấm theo kết quả (giao mã cửa căn còn người), không theo đường đi;
  - C1 vẫn cần, mức Major ở lượt 1 vẫn đúng.
- Đã sửa câu ở mục 3 (b) và thẻ BE-01. Chữ BR v0.5.6 và BR-402-05 cũng viết "bấm Cần dọn", ARC ghi thẻ Suggestion FB-R4-ARC-DOM-PR74-02.

### L2.6 Oracle và thẻ QA
- BR-402-04: ghi chú đã sửa theo C1. Lượt quá ngày đi thì `VD`/`CL` không có ngoại lệ; `VI`/`VC` chỉ chặn từ v1.0.5.
- BR-402-05 mới: căn 301, A 22–23/11, B đến 24/11, `CL` qua `needs_cleaning` + `start_cleaning` lúc 15:00 → `held_by_other_stay`, 409. Dòng này theo ví dụ BR v0.5.6, nhãn NGÀNH.
- Cả hai dòng vẫn do BE thêm, gắn "[GIẢ ĐỊNH QA]". Thẻ QA-PR74-01 (1) giữ: QA rà ở bước Kiểm thử.
- Ca kiểm Desk "quá ngày đi + `CL`": QA dựng căn `CL` qua API `status-transitions` hoặc từ căn `OD` sẵn (L2.5), không tìm nút "Cần dọn".
- QA-PR74-01 (2), truy vấn trước deploy, chưa có. Vẫn là điều kiện phát hành R3.

### L2.7 Kiểm lại bằng chạy thật

| Lần chạy | Kết quả |
|---|---|
| `checkin-occupied-exception.test.ts` @ `0950313e` | **7 passed (7)** |
| Như trên, đảo C1 (`roomOverridable` dùng `!heldToday`) | 1 failed / 6 passed – đỏ đúng ca 301 |
| `git merge-tree origin/main 0950313e` | sạch |
| `git merge-tree 5045c2de 0950313e` (#71) | xung đột `docs/api/openapi.yaml`, chỗ (k)/(l) |
| `gh pr checks 74` @ `0950313e` | 7 job xanh, gồm API contract (`--strict`) và Redocly. `format · lint · audit · test · build` đang chạy |

- Run 41881642069 tạo lúc 17:54Z, trước khi #76 vào `main` (17:58Z). Nếu job đỏ chỉ ở 2 ca ban đêm của `v104-holds-feb` thì đó là lỗi đã biết, không do #74.
- Lần đẩy K1 sẽ có #76.
- ARC không chạy lại 16 tệp / 265 test vì máy đang tải nặng. Lượt 1 đã chạy bản tương đương (A.5), và CI chạy toàn bộ `test/integration`.

### L2.8 Trạng thái thẻ sau lượt 2

| Thẻ | Mức | Trạng thái |
|---|---|---|
| BE-PR74-01 | Major | Fixed @ `0950313e`, chờ CI |
| BE-PR74-02 | Major | Fixed @ `0950313e`, chờ CI |
| BE-PR74-03 | Minor | Phần chữ xong; còn K1 (rebase sau #71, sinh lại client) |
| BE-PR74-04, BE-PR74-05 | Suggestion, Minor (v1.0.5) | Open, dời v1.0.5 |
| FE-PR74-01 | Major | Fixed ở #77 + #79, chờ CI #77 |
| DOM-PR74-01 | Minor | Fixed – BR v0.5.6 (`main` `ddda6bbf`) |
| DOM-PR74-02 (mới) | Suggestion | Open |
| QA-PR74-01 | Minor | Open (R3) |

Dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi):

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | #74 lượt 2 @ `0950313e` ĐẠT CÓ ĐK. C1, C2 khớp phụ lục; điều kiện còn lại là rebase sau #71 (giữ (k) rồi (l)), sinh lại client, CI xanh trên lần đẩy đó | ARC | Test 7/7; đảo C1 thì ca 301 đỏ; tên trường và giá trị trùng #79; xung đột với #71 chỉ ở danh sách thay đổi |

---

## Lượt 1 – Phán quyết (head `9646029d`): **ĐẠT CÓ ĐK**

Phần lõi đúng BR-402 (1) v0.5.3:
- `VD`/`CL` là trạng thái duy nhất có ngoại lệ;
- `OC`/`OD`/`OOO` không có ngoại lệ cho vai nào, kể cả lối FD xin duyệt và yêu cầu đã duyệt;
- xem trước và lệnh ghi dùng **cùng** `overridableBy`.

Test qua HTTP với đồng hồ giả, đọc oracle theo id. CI xanh.

Còn một lỗ trên đường an toàn. Lỗ này đến được bằng thao tác bình thường, không cần sửa tay. Đó là giả định (b): lượt **đã quá ngày đi** mà chưa B18 không được tính là còn ở căn. ARC đã dò thật:
- căn có lượt quá ngày đi, buồng phòng bấm "Cần dọn" rồi "Bắt đầu dọn", căn thành `CL` (ca dò đi qua API; đường trên giao diện v1.0.4 xem lượt 2, mục L2.5);
- lễ tân trưởng thấy ngoại lệ và nhận phòng đơn mới → **200**;
- kết quả: **hai lượt `in_house` trong một căn** (mục 1, mục 3).

Đây đúng là trường hợp hay gặp nhất mà DOM nêu: lễ tân quên bấm Trả phòng cho đơn cũ.

**Điều kiện gộp #74** (cùng một lần đẩy, một lần chạy CI):
- **C1 – FB-R4-ARC-BE-PR74-01 (Major)**: lượt quá ngày đi chưa B18 cũng **bỏ ngoại lệ** `VD`/`CL`. Cách làm: dùng `inRoomOnSql` nguyên cho `overridableBy`, giữ (b) của BE cho `met`.
  - Bản vá 4 dòng, ARC đã chạy: lỗ đóng, 16 tệp / 265 test liên quan xanh, **không phải sửa dữ liệu test nào**.
  - Thêm test cho đường `CL` qua API buồng phòng.
  - Bản chặt hoàn toàn (cả `met` của `VI`/`VC`) làm đỏ 14 tệp / 92 test vì dữ liệu test, nên dời v1.0.5 (FB-R4-ARC-BE-PR74-05).
- **C2 – FB-R4-ARC-BE-PR74-02 (Major)**: trả **lý do chặn tường minh** trên điều kiện `room_ready`: `cause`, và `heldByReservationCode` khi căn bị giữ. Đây là câu trả lời cho câu hỏi của ORC về cách đọc `detail` (mục 4). Nếu C2 không kịp trước 06/11 18:00 thì vẫn gộp được, theo phương án dự phòng ở mục 4.3.
- **C3 – FB-R4-ARC-BE-PR74-03 (Minor)**: chữ hợp đồng.
  - Bỏ "chờ ARC duyệt".
  - Thêm mục changelog **(l)** sau (k) của #71.
  - Sinh lại `api-client` sau khi rebase lên `main` có #71.
  - Không nâng `info.version`.

**Điều kiện phát hành v1.0.4 (ORC theo dõi)**:
- **R1 – FE-A** (#77 `v104/fe-checkin-occupied`, review `ARC-on-v104-pr77-checkin-occupied.md`):
  - hiện ô lý do và nút xin duyệt theo `overridableBy`, không theo `detail !== 'OOO'`;
  - đọc `cause` để chọn câu;
  - sửa mock `mocks/stay.ts`.
  - Xem FB-R4-ARC-FE-PR74-01. Thiếu bản này, API vẫn chặn đúng, nhưng Desk hiện ô lý do rồi nhận 409.
- **R2 – DOM** sửa câu BR-402 v0.5.4 theo C1 (FB-R4-ARC-DOM-PR74-01).
- **R3 – QA**:
  - rà lại oracle BR-402-03/04, vì do BE viết;
  - chạy truy vấn dữ liệu "căn có hai lượt đang ở" trên môi trường dùng thử trước khi deploy (FB-R4-ARC-QA-PR74-01).

## 1. Kiểm lại bằng chạy thật

| Lần chạy | Kết quả | Ghi chú |
|---|---|---|
| `gh pr checks 74` | Mọi job **pass**; job deploy/publish `skipping` (chỉ chạy ở `main`) | |
| Test của PR trên head (`checkin-occupied-exception`) | **4 passed (4)** | |
| Ca dò ARC (tạm, không commit) – căn 301: đơn A 22–23/11 đã nhận phòng, **không** trả phòng; đơn B đến 24/11. 24/11 14:30, FD gọi API buồng phòng `needs_cleaning` (`OC`→`OD`) rồi `start_cleaning` (`OD`→`CL`), cả hai **200** | Xem trước của lễ tân trưởng: `room_ready` `met:false`, `detail:"CL"`, **`overridableBy:[front_desk_lead, manager, owner]`**. Nhận phòng B có lý do → **200**. Căn 301 có **2** lượt `in_house`, buồng thành `OD` | **Lỗ (b)**. Không sửa trạng thái bằng tay, chỉ dùng thao tác SM-03 hợp lệ (`rules.ts` `roomTarget`: `OD → CL` được cả khi có khách ở). `room_status_mismatch` không báo vì buồng `CL` không thuộc nhóm so |
| Cùng ca dò – căn 302: A đi **hôm nay** 24/11, chưa trả phòng, buồng `CL` qua cùng hai thao tác | `room_ready` **không** có `overridableBy`, nhận phòng → **409** `CHECKIN_CONDITIONS_NOT_MET` `unmet:[room_ready]`, 1 lượt `in_house` | (a) chạy đúng trên đường thật. Test của PR chỉ phủ trường hợp sửa trạng thái bằng SQL |
| Biến thể chặt: bỏ `AND s.to_date >= $3::date` (`roomHeldByAnotherStay`) | Ca dò: 301 và 302 đều **409**, không có `overridableBy`. Test của PR **4/4** | Bản sửa C1 là một dòng |
| Biến thể chặt – `reversal-debt-g4` | **11 failed** (409 `room_ready` ở bước nhận phòng của helper) | Đúng như dự đoán: helper để lượt `in_house` mãi trong căn (mục 5) |
| Biến thể chặt – toàn bộ `test/integration` (99 tệp, 3012 test) | **94 failed**: 92 ở 14 tệp đều là 409 `room_ready` lúc nhận phòng; 2 lỗi khác do máy tải (`platform` hết giờ nối DB, `role-gate-first` 4508 > 4000 ms) | 14 tệp đều có một chỗ ép `room_status` = `VC` bằng SQL trên căn còn lượt cũ `in_house`, tức dữ liệu test, không phải luồng sản phẩm. Gồm `minibar-m1` (36), `s4-recheck6-be-a` (10), `reversal-debt-g4` (11), `frontdesk-s3-fixes` (8), `s438*-money` (19), `s438-beb`, `move-pricing`, `b16-preview-v101`, `s438-r8/r3-bb07-limit-basis`, `s438-r8/r3-be83-esc026` |
| **Biến thể v1.0.4 (C1)**: lượt quá ngày đi chỉ bỏ `overridableBy`, `met` giữ như BE (phụ lục A.5) | 14 tệp trên + test của PR + ca dò: **16 tệp, 265 passed (265)**. Ca dò: 301 **409** không `overridableBy`, 302 **409** | Đóng lỗ trên đường thật mà không sửa dữ liệu test. Còn hở `VI`/`VC` + lượt quá ngày đi, nhưng chỉ đến được khi sửa DB tay (mục 3 (b)) |
| Cây gộp thử `main` `da5c3c4c` + #71 `02c34bc9` + #74 | `git merge-tree`: **sạch** ở mọi thứ tự (main+74, 71+74, main+71). Sinh lại `api-client` từ `openapi.yaml` gộp → **không khác** | Thứ tự gộp ở mục 6 |

## 2. Mã so với quy tắc (BR-402 (1) v0.5.3, v0.5.4)

| Quy tắc | Mã #74 | Kết luận |
|---|---|---|
| Ngoại lệ chỉ `VD`/`CL`, FDL+ | `roomOverridable = room && !held && (VD \|\| CL)` → `overridableBy: FDL_UP` | Đúng |
| `OC`/`OD`/`OOO` không có ngoại lệ, mọi vai, cả lối FD xin duyệt | `overridableBy` vắng. B9 chỉ xét ghi đè khi `c.overridableBy` (dòng 622). Còn lại rơi xuống `unmet` → 409. Không có nhánh 202, không ghi gì | Đúng. Test phủ FDL/MGR/OWN, FD gửi yêu cầu, và FD mang `approvalRequestId` đã duyệt |
| Xem trước = lệnh ghi | Cùng `evaluate()`. Lệnh ghi đọc `c.overridableBy` của chính điều kiện, không tự tính lại theo `roomStatus` | Tốt, đúng nguyên tắc của phụ lục 5A |
| Sau B18 (`VD`) lễ tân trưởng dùng ngoại lệ, căn thành `OD`, có việc dọn ưu tiên | Không đổi. Test BR-402-03 nửa sau phủ | Đúng |
| "Căn còn một lượt Đang ở khác" (v0.5.4: đi hôm nay chưa B18, hoặc ở qua đêm nay), dù trạng thái buồng là gì | `roomHeldByAnotherStay`: `inRoomOnSql(D)` **và** `s.to_date >= D` | Đúng chữ v0.5.4. Nhưng chữ đó chép theo mã, mà BR-402 v0.5.3 để ARC chọn. Lý do của quy tắc là "làm căn có hai lượt đang ở", nên ARC chọn **tính cả lượt quá ngày đi** (C1, mục 3 (b)) |
| Lượt của chính đơn (gốc + con B9a/B13) không tính | `COALESCE(r.parent_reservation_id, r.id) <> root` | Đúng. Ngày đổi phòng: `inRoomOnSql` lấy đoạn phủ D, nên lượt vừa chuyển đi không giữ căn cũ |

## 3. Các giả định BE cần ARC duyệt

**(a) Chặn cả khi còn lượt `in_house` khác, dù trạng thái buồng là gì → DUYỆT.**
- Trạng thái buồng là cờ do người và việc định kỳ đổi. Bất biến cần giữ là "một căn, một lượt đang ở".
- (a) không chỉ cho trường hợp sửa tay. Trên đường thật, `OD → CL` (bắt đầu dọn) được phép khi khách còn ở (SM-03 R1). Vì vậy `CL` + khách đang ở là trạng thái **bình thường** (dọn ở lại, hoặc dọn trước khi khách đi). Thiếu (a), căn đó mở ngoại lệ.
- Ca dò 302 xác nhận (a) chặn đúng ở đây.

**(b) Lượt đã quá ngày đi (`to_date < D`) không tính → KHÔNG DUYỆT như hiện tại.** v1.0.4: lượt đó bỏ ngoại lệ (C1, FB-R4-ARC-BE-PR74-01, Major). v1.0.5: chặn hoàn toàn (FB-R4-ARC-BE-PR74-05).
- Lý do BE: lượt quá ngày đi thì buồng vẫn `OC`/`OD`, nên trạng thái đã chặn; lượt đó cũng hiện ở "Cần chú ý". Lý do này **sai ở `CL`**:
  - lễ tân quên B18 → lượt quá ngày đi vẫn `in_house`, buồng giữ `OC`;
  - J8 không đụng tới lượt này (`stayoverNightSql` cần `to_date > D`). Nhưng bảng buồng phòng (`inRoomOnSql`) vẫn hiện căn có khách, lại có khách đến hôm nay. Buồng đi `OC → OD` ("Cần dọn", R8a) rồi `OD → CL` ("Bắt đầu dọn", R1). Cả hai là chuyển trạng thái hợp lệ của FD/HK. **Sửa ở lượt 2:** v1.0.4 chưa có nút "Cần dọn" trên Desk hay app buồng phòng; `needs_cleaning` chỉ đi qua API. Trên giao diện, chỉ cần căn đã `OD` (ví dụ việc dọn ở lại chưa làm), rồi buồng phòng bấm "Bắt đầu dọn";
  - ở `CL` ngoại lệ mở lại;
  - lễ tân trưởng giao mã cửa căn đó cho khách mới.
- Nếu khách cũ thật ra ở quá hạn mà chưa gia hạn, khách mới bước vào căn có đồ, có người. Đây đúng là sự cố BR-402 muốn chặn. Ca dò 301 tái hiện được chỉ bằng thao tác hợp lệ.
- Hệ thống đã có một định nghĩa "đang ở căn" (`inRoomOnSql`). Định nghĩa này **tính** lượt quá ngày đi. Nó được dùng cho:
  - trạng thái suy ra (`current()` → `OC`);
  - `inHouseByRoom` của buồng phòng (dọn xong → `OC`, không `VC`);
  - `room_status_mismatch`;
  - bảng buồng phòng.
- Điều kiện nhận phòng lệch khỏi định nghĩa đó là nguồn của lỗ.
- Đích đúng là chặt hoàn toàn: lượt quá ngày đi giữ căn như mọi lượt `in_house` khác, lễ tân phải B18 lượt cũ trước. BR-402 v0.5.3/v0.5.4 đã yêu cầu đúng việc này ("trả phòng đơn đó trước"). B18 vướng số dư thì dùng nhánh ghi nợ khi trả phòng, hoặc đổi khách mới sang căn trống.
- Nhưng bản chặt hoàn toàn làm đỏ 14 tệp / 92 test. Lý do là dữ liệu test ép `VC` bằng SQL lên căn còn lượt cũ (mục 1). Sửa đủ trước mốc cắt 06/11 18:00 thì rủi ro.
- **v1.0.4 làm theo bậc**:
  - `overridableBy` dùng `inRoomOnSql` nguyên. Căn còn bất kỳ lượt `in_house` nào khác, kể cả quá ngày đi, thì không có ngoại lệ `VD`/`CL`.
  - `met` của `VI`/`VC` giữ (b) của BE.
- Bản theo bậc đóng mọi đường **sản phẩm** đến được. Có lượt `in_house` giữ căn thì buồng chỉ có thể `OC`/`OD`/`CL` qua thao tác thật:
  - dọn xong dùng `inHouseByRoom` (gồm quá ngày đi), nên ra `OC`, không ra `VC`;
  - `VI` chỉ đến từ `VC`;
  - B18 đặt `VD` cho chính lượt đó, nên lượt đó không còn `in_house`.
- Còn hở `VI`/`VC` + lượt quá ngày đi, nhưng chỉ khi sửa DB tay hoặc khi dữ liệu đã lệch từ v1.0.3. Truy vấn QA trước deploy (FB-R4-ARC-QA-PR74-01) phủ trường hợp sau.

**(c) Ở cửa sổ B9a 04:30, lượt đi đúng ngày đó mà chưa trả phòng vẫn giữ căn → DUYỆT.**
- Lúc 04:30 ngày X, ngày nghiệp vụ là X−1 (`business_day_rollover`). Lượt đi X−1 chưa B18 là "lượt đi hôm nay chưa trả phòng" theo ngày nghiệp vụ, nên giữ căn là nhất quán.
- Lượt đi X (khách đang ngủ đêm X−1→X) thì có đoạn phủ D, nên đương nhiên giữ căn.
- (c) đúng cả với bản v1.0.4 lẫn bản chặt v1.0.5.

**(e) Hợp đồng chỉ đổi mô tả → DUYỆT ở bản `9646029d`, nhưng C2 thêm hai trường tùy chọn, chỉ đọc.**
- Hai trường thuộc loại 0.3.12 cho phép ("trường chỉ đọc"), không bỏ trường nào.
- Hành vi bị **thu hẹp** trong mã lỗi đã có: `OC`/`OD` mất `overridableBy`, mất nhánh 202. Mục changelog (l) phải ghi rõ "thu hẹp hành vi" và "Desk sửa cùng v1.0.4".

**`info.version` → KHÔNG nâng, giữ `0.3.12-draft`.**
- `0.3.12-draft` là nhãn hợp đồng của gói v1.0.4, chưa phát hành.
- Chỉ `admin-web` gọi `previewCheckIn`/`checkIn`; `mobile`, `guest-web`, `booking-web` không gọi.
- API và Desk lên cùng bản.
- Ghi mục (l) trong danh sách 0.3.12, sau (k) của #71.

## 4. Câu hỏi ORC: cách đọc `detail` của DOM (DOM lượt 5 mục 2) cho câu chặn trên Desk

### 4.1 Cách đọc có đúng trên `9646029d` không – **đúng, với một ngoại lệ**
Từ mã:
- `met = room && !held && status ∈ {VI, VC}`;
- `overridableBy` có ⇔ `room && !held && status ∈ {VD, CL}`.

Vậy khi `met:false` và không có `overridableBy`:
- `detail ∈ {OC, OD, OOO}` → chặn do trạng thái buồng (có thể đồng thời có lượt giữ căn);
- `detail ∈ {VI, VC, VD, CL}` → **chỉ có thể** do lượt khác giữ căn.

Cách đọc của DOM khớp, **trừ khi đơn chưa có căn**:
- `room = null` thì `roomStatus` mặc định `'VC'` (`checkin.service.ts` dòng 244–246). Kết quả là `met:false`, `detail:"VC"`, không `overridableBy`.
- Theo cách đọc DOM, Desk sẽ báo "căn còn khách đơn khác" – sai.
- B9 khi đó trả `RESERVATION_UNASSIGNED`.

### 4.2 Có ổn định và có ghi trong openapi B9 không – **không đủ để FE dựa vào**
- Mô tả B9 của #74 có đủ **mảnh**: `detail` = trạng thái buồng, không `overridableBy` khi căn còn lượt khác "kể cả khi trạng thái buồng bị sửa tay". Nhưng mô tả không nêu **quy tắc suy luận**. Suy luận dựa vào chỗ *vắng* một trường.
- Thêm bất kỳ nguyên nhân chặn không-ghi-đè nào sau này (ví dụ ngày về căn cũ chưa ghi, mục 7 thẻ 04) sẽ làm sai câu mà không test nào báo.
- Thân 409 của B9 chỉ có `unmet:[room_ready]`, không có `detail`, nên Desk luôn phải đọc lại xem trước để chọn câu.
- Sau C1, trường hợp hay gặp nhất (quên B18) thường hiện `OC`/`OD`, tức rơi vào nhánh "trạng thái buồng". Việc lễ tân cần làm lại là "trả phòng **đơn X**", mà Desk không biết X.

### 4.3 Quyết định – #74 trả lý do tường minh (C2). Chặn gộp #74, không chặn mốc cắt nếu dùng dự phòng

Thêm vào phần tử `CheckInPreview.conditions[]`. Chỉ `room_ready` dùng, chỉ khi `met:false`:
- `cause` – `room_status` | `held_by_other_stay` | `no_room`.
  - **Ưu tiên** `held_by_other_stay` khi căn còn lượt khác, dù buồng `OC`/`OD`.
  - `room_status` khi chỉ trạng thái buồng chưa đạt (`VD`/`CL` có ngoại lệ; `OC`/`OD` không có lượt nào là lệch trạng thái; `OOO`).
  - `no_room` khi đơn chưa có căn.
- `heldByReservationCode` – mã đơn **gốc** đang giữ căn, khi `cause = held_by_other_stay`.
  - Lễ tân đã xem được mọi đơn trên sơ đồ phòng. Mã đơn không phải dữ liệu cá nhân, không có tên khách.
- `detail` **giữ nguyên** là trạng thái buồng. Không nạp chồng nghĩa: FE đang dùng `detail` làm nhãn trạng thái và để nhận `OOO`.

Chữ hợp đồng và phác thảo mã ở **phụ lục A**. Việc BE nhỏ:
- `roomHeldByAnotherStay` trả mã đơn gốc thay cho boolean;
- 2 dòng trong `evaluate()`;
- sinh lại `openapi-meta`/`openapi-schemas`, vì serializer theo schema sẽ bỏ trường không khai;
- sinh lại `api-client`;
- mỗi ca test thêm 1 khẳng định.

BE nên đẩy cùng C1, để CI chỉ chạy một lần.

**Chặn hay không**:
- C2 là điều kiện gộp #74, vì FE-A cần nó cho câu chặn của v1.0.4.
- **Dự phòng** nếu BE không kịp trước 06/11 18:00: gộp #74 với C1 + C3. Ghi cách đọc DOM thành **quy tắc hợp đồng** trong mô tả B9: "khi `not_unassigned` đạt và đơn có căn: `met:false`, không `overridableBy`, `detail ∉ {OC, OD, OOO}` = căn còn lượt khác". `cause` dời sang v1.0.5, chỉ thêm, không phá FE.
- **FE-A làm ngay, không chờ**: `cause` có thì dùng `cause`, không có thì dùng cách đọc DOM, kèm điều kiện `not_unassigned` đạt. Cùng một mã chạy được với cả hai bản API. FE-A `aca63a0` không bị chặn.

Câu chặn: theo DOM lượt 5. Ưu tiên chỉ đường **Trả phòng đơn trước** (có mã đơn khi có `heldByReservationCode`), sau đó **Đổi căn** hoặc **Mời khách chờ**. Chỉ nhắc buồng phòng khi `cause = room_status` mà `detail` là `OC`/`OD` (lệch trạng thái). Chữ do UXD chốt, theo giọng OTTIMO: ngắn, điềm tĩnh, không emoji.

## 5. Sửa test `reversal-debt-g4` – có che lỗi thật không: **không che lỗi sản phẩm; giữ cho v1.0.4**
- Helper `childStay` đặt buồng `VC` bằng SQL (`INSERT … room_status 'VC'`) rồi nhận phòng B9a 04:30. Lượt nó tạo **không bao giờ** trả phòng. Lần sau dùng lại căn đó, căn vẫn còn lượt cũ `in_house`.
- Trước #74 test xanh nhờ chính lỗi BUG-R4-039: hai lượt đang ở trong một căn sau khi sửa tay trạng thái.
- Chủ đề của test là thứ tự khóa và deadlock giữa A32 trên đêm của đơn con và FOC trên folio. Không liên quan căn có người hay không. Bỏ qua khe "lượt cũ đi đúng ngày nghiệp vụ" không làm yếu khẳng định nào:
  - vòng `do…while` dừng (mỗi căn dùng cách một khe);
  - `childOutcome` so với chính lượt tuần tự của cùng thứ tự.
- Với bản C1 v1.0.4, bản sửa này vẫn đúng: tệp xanh 100 % trong lần chạy biến thể (mục 1), vì `met` của `VC` không đổi.
- Với bản chặt v1.0.5 (thẻ 05), tệp này và 13 tệp khác phải làm lại dữ liệu: lượt quá ngày đi giữ căn vô hạn. BE chọn một trong hai:
  - (1) một helper dùng chung trong `test/helpers`, đặt `VC` **và** kết thúc lượt cũ của căn (B18 thật nếu số dư cho phép, không thì SQL có ghi chú);
  - (2) không dùng lại căn còn lượt `in_house`.
  - Không nên bỏ khe như hiện nay.

## 6. Thứ tự gộp với #71
- **#71 trước** (P0). Sau đó #74 rebase lên `main` có #71.
- Mã không chồng. `merge-tree` sạch cả ba cặp. Sinh lại `api-client` từ cây gộp hiện tại không khác.
- Sau C2/C3, `openapi.yaml` của #74 đổi thêm, nên **phải** sinh lại `api-client` (và `openapi-meta`, `openapi-schemas`) **sau** khi rebase. Không sinh trên nền cũ rồi trộn, bài học BUG-R4-030.
- Mục changelog là **(l)**, sau (k) của #71.
- CI phải chạy thật toàn bộ test API (cache miss), giống #71.
- `#74` đang dựa trên `ea979fe7`, chưa có #67, #73 của `main`. Rebase cũng gom luôn hai PR này.

## 7. Hệ quả FE (PR không đổi FE)
Nay FE-A làm ở PR #77 (review riêng `ARC-on-v104-pr77-checkin-occupied.md`). Đoạn dưới mô tả `main`.

`CheckInPage.tsx` hiện:
- tính `ooo = detail === 'OOO'`;
- cho ô lý do của lễ tân trưởng và nút "Gửi xin duyệt" của FD với **mọi** `met:false` khác `OOO`.

Sau #74:
- `OC`/`OD` và căn còn lượt khác → lễ tân gõ lý do rồi nhận **409**;
- FD bấm xin duyệt cũng nhận 409.

An toàn vì máy chủ chặn, nhưng Desk dắt người dùng vào ngõ cụt. Mock `mocks/stay.ts` dòng 1014 vẫn trả `overridableBy` cho mọi trạng thái trừ `OOO`, nên demo và e2e chạy trên mock sẽ lệch máy chủ. Chi tiết ở FB-R4-ARC-FE-PR74-01.

## Thẻ feedback

### FB-R4-ARC-BE-PR74-01
- Mức độ: Major
- Vị trí:
  - `checkin.service.ts` `evaluate()` (`roomOverridable`), `roomHeldByAnotherStay` (`AND s.to_date >= $3::date`) và chú thích phía trên;
  - `openapi.yaml` mô tả `checkIn` ("lượt quá ngày đi không tính ở bước này");
  - `checkin-occupied-exception.test.ts`.
- Vấn đề: lượt `in_house` đã quá ngày đi không được tính là còn ở căn. Buồng của lượt đó đi `OC → OD → CL` bằng hai chuyển trạng thái hợp lệ ("Cần dọn", "Bắt đầu dọn"), và ở `CL` ngoại lệ mở lại. Lượt 2: v1.0.4 không có nút "Cần dọn", nên trên giao diện đường này cần căn đã `OD` sẵn (mục L2.5). Ca dò ARC: lễ tân trưởng nhận phòng → 200, căn có 2 lượt `in_house`.
- Vì sao quan trọng:
  - đây là đường an toàn của BR-402 (giao mã cửa căn có người);
  - xảy ra ở trường hợp hay gặp: quên B18;
  - định nghĩa lệch khỏi `inRoomOnSql` mà trạng thái suy ra, buồng phòng và `room_status_mismatch` đều dùng.
  - Hệ quả dữ liệu: B18 sau đó của lượt cũ đặt căn `VD` (`checkout.service.ts` dòng 1401–1407) trong khi khách mới đang ở.
- Đề xuất sửa (v1.0.4, theo bậc – phụ lục A.5):
  - `overridableBy` chỉ khi buồng `VD`/`CL` **và** không còn lượt nào theo `inRoomOnSql(D)` nguyên, kể cả quá ngày đi. `met` của `VI`/`VC` giữ như hiện tại.
  - ARC đã chạy bản vá: 16 tệp / 265 test xanh, ca dò đóng, không đổi dữ liệu test.
  - Sửa chú thích và câu hợp đồng (phụ lục A.1).
  - Thêm 2 ca test, đi qua API `status-transitions` (không dùng SQL):
    - lượt đi hôm nay, buồng `CL` → không ngoại lệ, 409;
    - lượt quá ngày đi, buồng `CL` → không ngoại lệ, 409.
  - Có thể dựng theo ca dò ARC: căn 301/302, A 22–23/11 và 23–24/11, B đến 24/11, 14:30 `needs_cleaning` rồi `start_cleaning`.
- Trạng thái: Fixed @ `0950313e` (ARC lượt 2: ca 301 canh được, đảo bản vá thì đỏ). Chờ CI

### FB-R4-ARC-BE-PR74-02
- Mức độ: Major
- Vị trí:
  - `checkin.service.ts` `evaluate()` (điều kiện `room_ready`), `roomHeldByAnotherStay`;
  - `openapi.yaml` `CheckInPreview.conditions[]`;
  - `api-client`, `openapi-meta.ts`, `openapi-schemas.ts`.
- Vấn đề: Desk phải đoán lý do chặn từ việc *vắng* `overridableBy` cộng `detail`. Cách đoán:
  - sai khi đơn chưa có căn (`detail` mặc định `VC`);
  - không cho biết đơn nào đang giữ căn;
  - không có câu hợp đồng nào bảo đảm (mục 4).
- Vì sao quan trọng:
  - FE-A đang dựng câu chặn của v1.0.4 trên cách đoán này;
  - việc lễ tân cần làm là "trả phòng đơn X trước";
  - thêm nguyên nhân chặn mới sẽ làm sai câu trong im lặng.
- Đề xuất sửa:
  - Thêm `cause` (`room_status` | `held_by_other_stay` | `no_room`; ưu tiên `held_by_other_stay`) và `heldByReservationCode` (mã đơn gốc) theo phụ lục A.
  - Thêm khẳng định trong 4 ca hiện có và 2 ca của thẻ 01.
  - Đẩy cùng thẻ 01.
  - Không kịp trước 06/11 18:00 thì dùng dự phòng mục 4.3: ghi quy tắc đọc vào mô tả B9, `cause` dời v1.0.5.
- Trạng thái: Fixed @ `0950313e` (đường C2, không dùng dự phòng). Chờ CI

### FB-R4-ARC-BE-PR74-03
- Mức độ: Minor
- Vị trí: `openapi.yaml` mô tả `checkIn` và danh sách thay đổi 0.3.12; `api-client/src/generated/openapi.ts`
- Vấn đề:
  - mô tả đang ghi "chờ ARC duyệt";
  - danh sách 0.3.12 chưa có mục cho BUG-R4-039;
  - #71 đã chiếm (k).
- Vì sao quan trọng: hợp đồng là nguồn sự thật. Chữ "chờ duyệt" trên bản phát hành làm FE/QA không biết đó là hành vi chốt hay chưa.
- Đề xuất sửa: thay bằng chữ ở phụ lục A (A.1, A.2, A.3). Rebase lên `main` sau #71, sinh lại client trên cây đã rebase. Không nâng `info.version`.
- Trạng thái: Open, phần chữ đã sửa @ `0950313e`. Còn rebase sau #71 và sinh lại client (mục L2.3)

### FB-R4-ARC-BE-PR74-04
- Mức độ: Suggestion
- Vị trí: `checkin.service.ts` `roomHeldByAnotherStay`; `housekeeping/public/stay-occupancy.ts`; `housekeeping.service.ts` `inHouseByRoom` (nhánh `movedRoomId` của `roomReturnsOn`)
- Vấn đề:
  - Frontdesk tự ghép SQL "ai đang ở căn" từ `inRoomOnSql`, rồi thêm bộ lọc riêng. Đây là gốc của thẻ 01.
  - Buồng phòng còn một trường hợp mà `inRoomOnSql` không có: ngày về căn cũ (BR-424-05, `until_parent_departure`) khi chưa ghi khách chuyển về. Khách vẫn ở căn mới dù đoạn hôm nay đã là căn cũ. Căn mới đó có thể lên `CL` và mở ngoại lệ cho đơn đến cùng ngày.
- Vì sao quan trọng: một khái niệm, hai cách tính, thì sẽ lệch tiếp ở lần sửa sau.
- Đề xuất sửa (v1.0.5): đưa một hàm công khai `roomOccupantOn(tx, roomId, D)` vào `housekeeping/public`. Hàm trả mã đơn gốc, đã gồm trường hợp ngày về chưa ghi. Điều kiện nhận phòng, trạng thái suy ra và bảng buồng phòng cùng gọi hàm này. Kèm test ngày về.
- Trạng thái: Open

### FB-R4-ARC-BE-PR74-05
- Mức độ: Minor (v1.0.5)
- Vị trí: `checkin.service.ts` `roomHeldByAnotherStay`. Dữ liệu test của 14 tệp ép `room_status` bằng SQL (danh sách ở mục 1).
- Vấn đề: sau C1, `VI`/`VC` + lượt quá ngày đi vẫn nhận phòng thường được. Chỉ đến được khi sửa DB tay hoặc dữ liệu đã lệch, nhưng vẫn là hai lượt `in_house` trong một căn. Dữ liệu test của 14 tệp đang dựng đúng trạng thái không thể có đó.
- Vì sao quan trọng: bất biến "một căn, một lượt đang ở" nên do máy chủ giữ trọn vẹn. Dữ liệu test dựng trạng thái không thể có thì che lỗi kiểu BUG-R4-039 lần sau.
- Đề xuất sửa:
  - dùng một hàm "người đang ở căn" (thẻ 04) cho cả `met` lẫn `overridableBy`;
  - sửa dữ liệu test bằng một helper dùng chung (mục 5).
- Trạng thái: Open

### FB-R4-ARC-FE-PR74-01
- Mức độ: Major
- Vị trí: `apps/admin-web/src/pages/stay/CheckInPage.tsx`; `apps/admin-web/src/mocks/stay.ts`. Nay là PR **#77** `v104/fe-checkin-occupied` @ `99d2c01b`, ARC review riêng: `rounds/round-04/reviews/ARC-on-v104-pr77-checkin-occupied.md` (ĐẠT CÓ ĐK).
- Vấn đề (trên `main`):
  - ô lý do, nút xin duyệt và nút "Xác nhận ngoại lệ" hiện theo `!met && detail !== 'OOO'`, không theo `overridableBy`;
  - chưa có câu cho "căn còn khách đơn khác";
  - mock trả `overridableBy` cho mọi trạng thái trừ `OOO`.
- Vì sao quan trọng: sau #74, lễ tân trưởng và FD gõ lý do rồi nhận 409 ở `OC`/`OD` và căn còn lượt khác. Demo và e2e chạy trên mock không thấy lỗi này.
- Đề xuất sửa: #77 đã làm phần chính (theo `overridableBy`, chặn cứng, câu theo DOM, mock). Còn lại, theo review #77:
  - gộp `main` + sinh lại chữ;
  - theo C1/C2 của #74 (`cause`, `heldByReservationCode`, lượt quá ngày đi);
  - bỏ nhánh `ROOM_OCCUPIED`;
  - không chặn khi đơn chưa có căn.
- Trạng thái: Fixed ở #77 @ `99d2c01b` cùng #79 @ `b5fd9bd3` (review `ARC-on-v104-pr79-checkin-cause.md`, ĐẠT CÓ ĐK). Chờ CI #77

### FB-R4-ARC-DOM-PR74-01
- Mức độ: Minor
- Vị trí: `business-rules.md` BR-402 (1) v0.5.4 ("chưa trả phòng hôm nay (đi hôm nay chưa B18, hoặc ở qua đêm nay)"); sổ tay mục 2.14/2.20 nếu chép câu này
- Vấn đề: câu v0.5.4 chép định nghĩa (b) của BE. ARC không duyệt (b) như hiện tại (thẻ BE-01).
- Vì sao quan trọng: QA dựng ca kiểm từ BR. Nếu giữ câu cũ, ca "quá ngày đi + `CL`" sẽ bị ghi là sai mong đợi.
- Đề xuất sửa: thêm câu "căn còn lượt Đang ở đã quá ngày đi mà chưa bấm Trả phòng: **không có ngoại lệ** `VD`/`CL` (v1.0.4); từ v1.0.5 chặn như mọi lượt Đang ở khác", ghi ARC chọn 05/11. Không cần đổi phần "việc đầu là lễ tân trả phòng đơn cũ", vì C1 chính là ép việc đó.
- Trạng thái: Fixed – BR v0.5.6 trên `main` (`ddda6bbf`). Còn một điểm chữ ở thẻ DOM-PR74-02

### FB-R4-ARC-QA-PR74-01
- Mức độ: Minor
- Vị trí: `tests/fixtures/br-examples.json` BR-402-03/04; `rounds/round-04/qa/v1.0.4-test-cases.md`
- Vấn đề:
  - (1) Hai dòng oracle do **BE** (bên cài đặt) viết, gắn nhãn "[GIẢ ĐỊNH QA]", chưa có QA/DOM rà. Ghi chú BR-402-04 ghi "chặn khi căn còn đơn in_house khác đi hôm nay hoặc phủ đêm nay", sẽ sai sau C1.
  - (2) Từ v1.0.3, máy chủ cho ngoại lệ ở `OC`/`OD`, nên môi trường dùng thử có thể đã có căn hai lượt `in_house`. Cũng có thể còn yêu cầu `checkin_room_not_ready` đang chờ cho căn `OC`/`OD`, mà sau deploy duyệt xong cũng không dùng được.
- Vì sao quan trọng: oracle do bên cài đặt tự viết là tự chấm bài. Dữ liệu lệch có sẵn thì sau deploy chặn nhận phòng mà lễ tân không hiểu vì sao.
- Đề xuất sửa:
  - QA rà BR-402-03/04 ở bước Kiểm thử, DOM xác nhận nhãn. Sửa ghi chú BR-402-04 sau C1.
  - Thêm ca kiểm Desk "quá ngày đi + `CL`".
  - Chạy truy vấn chỉ đọc trước deploy (QA hoặc OPS, giống BUG-R4-037):
    - căn có ≥ 2 đơn gốc `in_house` theo `inRoomOnSql(hôm nay)`;
    - `approval_request` `checkin_room_not_ready` `pending` mà buồng đích `OC`/`OD`.
  - Báo số, không sửa dữ liệu.
- Trạng thái: Open. Lượt 2: ghi chú BR-402-04 đã sửa theo C1, BR-402-05 đã thêm, nhưng cả hai vẫn do BE viết ("[GIẢ ĐỊNH QA]"). Truy vấn trước deploy chưa có (mục L2.6)

### FB-R4-ARC-DOM-PR74-02 (lượt 2)
- Mức độ: Suggestion
- Vị trí:
  - `business-rules.md` BR-402 (1) v0.5.6: phần "buồng phòng bấm Cần dọn, Bắt đầu dọn thành `CL`" và ví dụ căn 301;
  - `br-examples.json` BR-402-05 (`case`);
  - sổ tay, nếu chép ví dụ này.
- Vấn đề:
  - v1.0.4 không có nút "Cần dọn" trên Desk hay app buồng phòng. Bước `needs_cleaning` (`OC → OD`) chỉ đi qua API.
  - Trên giao diện, "Cần dọn" lại là **tên trạng thái** `VD` ("Cần dọn (khách đã đi)", `hk.status.VD`) và tên bộ lọc `VD`/`OD`/`CL`.
  - Câu "bấm Cần dọn" vì vậy đọc như có một nút không tồn tại, hoặc như đặt căn về `VD`.
- Vì sao quan trọng: ví dụ này sẽ được chép vào sổ tay và ca kiểm Desk. Người đọc tìm một nút không có, hoặc hiểu sai trạng thái.
- Đề xuất sửa: tả đường giao diện thật của v1.0.4: "căn đang hiện cần dọn (`OD`), buồng phòng bấm Bắt đầu dọn, căn thành `CL`". Quy tắc và kết luận giữ nguyên. Oracle BR-402-05 đi qua API nên vẫn đúng, chỉ sửa chữ ở `case` cho khớp.
- Trạng thái: Open

## Điểm làm tốt (nên giữ)
- Lệnh ghi dùng đúng `overridableBy` của điều kiện mà xem trước trả về. Hai nơi không thể lệch nhau, và lối "yêu cầu đã duyệt từ v1.0.3" cũng bị chặn theo cùng điều kiện.
- Test có ca đối chứng (VD/CL vẫn dùng ngoại lệ, FD vẫn ra 202). Có ca "yêu cầu đã duyệt" chèn thẳng vào bảng để chứng minh không còn cửa sau. Mọi ca kiểm "không ghi gì": trạng thái đơn, buồng, yêu cầu, việc dọn.
- PR body tự nêu điểm cần ARC quyết (`info.version`, (a)–(e)), hệ quả FE và kiểm gộp với #71. Review nhanh.

## Quyết định ARC – dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi; ARC không sửa tệp đang có thay đổi của vai khác)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | BUG-R4-039: căn còn lượt `in_house` khác thì không có ngoại lệ `VD`/`CL`, theo **đúng** định nghĩa "đang ở căn" của buồng phòng (`inRoomOnSql`), **kể cả lượt quá ngày đi chưa B18**. `met` của `VI`/`VC` theo (b) của BE ở v1.0.4; v1.0.5 chặn hoàn toàn và sửa dữ liệu test | ARC | BR-402 v0.5.3 để ARC chọn. `CL` + khách ở là trạng thái hợp lệ. Ca dò: lượt quá ngày đi + `CL` mở ngoại lệ → 2 lượt `in_house`. Chặn hoàn toàn đỏ 14 tệp test vì dữ liệu SQL, không kịp mốc cắt |
| 2026-11-05 | 4 | Hợp đồng 0.3.12 (l): `room_ready` thêm `cause` + `heldByReservationCode` (chỉ đọc, tùy chọn). `detail` giữ là trạng thái buồng. Không nâng `info.version` | ARC | Desk cần lý do và mã đơn cho câu "Trả phòng đơn trước". Suy luận từ chỗ vắng `overridableBy` dễ vỡ và sai khi đơn chưa có căn |
| 2026-11-05 | 4 | Thứ tự gộp: #71 trước, #74 rebase sau, sinh lại client trên cây đã rebase, CI chạy thật. FE-A đọc `cause`, thiếu thì đọc như DOM lượt 5 | ARC | Không chồng mã. FE không phải chờ API |

## Phụ lục A – chữ hợp đồng và phác thảo mã đề xuất (BE áp vào #74)

**A.1 – thay đoạn "v1.0.4 (BUG-R4-039 …)" trong mô tả `checkIn`:**

```yaml
        **v1.0.4 (BUG-R4-039, BR-402 (1) v0.5.3; ARC 05/11 `rounds/round-04/reviews/ARC-on-v104-pr74-checkin-occupied.md`)**: ngoại lệ này chỉ khi buồng `VD`/`CL`
        **và** căn không còn lượt `in_house` khác "đang ở căn" theo định nghĩa của buồng phòng (đoạn phủ đêm nay; lượt đi hôm nay chưa B18; lượt đã **quá ngày đi**
        mà chưa B18 cũng tính – trả phòng lượt đó trước). Buồng `OC`/`OD`/`OOO`, hoặc căn còn lượt đi hôm nay/phủ đêm nay (kể cả khi buồng `CL` vì đang dọn, hay bị
        sửa thành `VD`/`VI`/`VC`): `room_ready` chưa đạt, **không có** `overridableBy`. Căn chỉ còn lượt quá ngày đi: buồng `VD`/`CL` không có `overridableBy`
        (buồng `VI`/`VC` vẫn đạt ở v1.0.4). Mọi vai gửi `roomNotReadyOverride` khi không có `overridableBy` (lý do, hay `approvalRequestId` của yêu cầu đã duyệt)
        → `409 CHECKIN_CONDITIONS_NOT_MET` (`unmet` gồm `room_ready`), không tạo yêu cầu duyệt (không có nhánh 202), không ghi gì. Client hiện ô lý do/nút xác nhận
        theo `overridableBy`; chọn câu chặn theo `cause` (xem `CheckInPreview.conditions[]`), không suy từ `detail`.
```

**A.2 – `CheckInPreview.conditions[].properties` thêm (sau `overridableBy`):**

```yaml
              cause:
                type: string
                enum: [room_status, held_by_other_stay, no_room]
                description: '0.3.12 (l), chỉ `room_ready` khi `met=false`. `held_by_other_stay`: căn còn lượt `in_house` khác (ưu tiên, dù buồng `OC`/`OD`) – không có ngoại lệ; `room_status`: chỉ trạng thái buồng chưa đạt (`VD`/`CL` có `overridableBy`; `OC`/`OD` không có lượt nào = trạng thái lệch; `OOO`); `no_room`: đơn chưa có căn. Tập mở: mã lạ → hiện câu chung'
              heldByReservationCode:
                type: string
                description: '0.3.12 (l), khi `cause = held_by_other_stay`: mã đơn **gốc** đang giữ căn (Desk dẫn tới đơn đó để trả phòng)'
```

Mô tả của `code`, phần `room_ready`, sửa thành:
- "`detail` = trạng thái buồng (đơn chưa có căn: vắng)";
- "lý do chặn ở `cause`".

Lúc không có căn thì bỏ `detail`, không còn trả `'VC'` mặc định.

**A.3 – danh sách "Thay đổi phiên bản 0.3.12-draft", thêm sau (k):** (lượt 2: bản đầu ghi nhầm `getCheckInPreview`; `operationId` đúng là `previewCheckIn`, BE đã dùng đúng)

```yaml
    - **(l) BUG-R4-039 (P1, BR-402 (1) v0.5.3; ARC 05/11 `rounds/round-04/reviews/ARC-on-v104-pr74-checkin-occupied.md`)**: `checkIn`/`previewCheckIn` – ngoại lệ
      "buồng chưa sẵn sàng" chỉ cho `VD`/`CL` khi căn không còn lượt `in_house` khác (kể cả lượt quá ngày đi chưa B18); `OC`/`OD`/`OOO` hoặc căn còn lượt khác →
      `room_ready` không có `overridableBy`, `roomNotReadyOverride` → `409 CHECKIN_CONDITIONS_NOT_MET` cho mọi vai, không còn nhánh 202 – **thu hẹp hành vi** trong mã
      lỗi đã có; Desk sửa cùng v1.0.4 (theo `overridableBy`). `CheckInPreview.conditions[]` thêm `cause`, `heldByReservationCode` (chỉ đọc, tùy chọn).
```

**A.4 – phác thảo mã gồm C1 + C2 (BE tự viết lại, test quyết định):**

```ts
// roomHolder: another in-house stay in the room on D (inRoomOnSql as is – overdue included), its root code,
// and whether its segment ended before D. A holder that has not ended wins over an overdue one.
`SELECT root.code, (s.to_date < $3::date) AS overdue
   FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
   JOIN reservation root ON root.id = COALESCE(r.parent_reservation_id, r.id)
  WHERE s.room_id = $1 AND COALESCE(r.parent_reservation_id, r.id) <> $2::uuid AND ${inRoomOnSql('$3::date')}
  ORDER BY (s.to_date < $3::date), s.from_date LIMIT 1`

const holder = room ? await this.roomHolder(tx, room.id, row, ctx) : null; // { code, overdue } | null
const heldToday = !!holder && !holder.overdue; // v1.0.4: `met` as BE (b); v1.0.5: `!!holder`
const roomReady = !!room && !heldToday && (roomStatus === 'VI' || roomStatus === 'VC');
const roomOverridable = !!room && !holder && (roomStatus === 'VD' || roomStatus === 'CL');
{
  code: 'room_ready',
  met: roomReady,
  ...(roomReady ? {} : {
    ...(room ? { detail: roomStatus } : {}),
    cause: !room ? 'no_room' : holder ? 'held_by_other_stay' : 'room_status',
    ...(holder ? { heldByReservationCode: holder.code } : {}),
  }),
  ...(roomOverridable ? { overridableBy: FDL_UP } : {}),
}
```

**A.5 – bản vá C1 tối thiểu ARC đã chạy (không có C2), trên `9646029d`:**

```diff
     const heldByAnotherStay = !!room && (await this.roomHeldByAnotherStay(tx, room.id, row, ctx));
+    const heldAny = !!room && (await this.roomHeldByAnotherStay(tx, room.id, row, ctx, true));
     const roomReady = !!room && !heldByAnotherStay && (roomStatus === 'VI' || roomStatus === 'VC');
     const roomOverridable =
-      !!room && !heldByAnotherStay && (roomStatus === 'VD' || roomStatus === 'CL');
+      !!room && !heldAny && (roomStatus === 'VD' || roomStatus === 'CL');
@@ roomHeldByAnotherStay(
     ctx: BookingContext,
+    includeOverdue = false,
   ): Promise<boolean> {
-          AND ${inRoomOnSql('$3::date')} AND s.to_date >= $3::date
+          AND ${inRoomOnSql('$3::date')} ${includeOverdue ? '' : 'AND s.to_date >= $3::date'}
```

Kết quả: 16 tệp / 265 test xanh (14 tệp đỏ ở bản chặt + test của PR + ca dò), ca dò 301 và 302 đều 409.
