# ARC review 3 PR FE của v1.0.5 – #98 (V5-50), #102 (V5-15 nút Cần dọn), #107 (V5-46)

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 06/11/2026.
- PR và commit đã review (không đổi trong lúc review):
  - #98 `r5-fe-v5-50` @ `1efe60c7` (gốc `ab1fc4ae`), FE-A.
  - #102 `r5-fe-v5-15-clean` @ `71db3338` (gốc `6094ad90`; CI chạy trên bản gộp với `main` sau `d86f1c07`), FE-A.
  - #107 `r5-fe-v5-46` @ `e2ffd228` (gốc `ab1fc4ae`), FE-B.
- Đã đọc: thân PR, `gh pr diff` cả ba, báo cáo FE trong từng PR; hợp đồng 0.3.13 mục 1.4, 1.12, 1.18, 2 (`rounds/round-05/outputs/ARC/contract-0.3.13.md`, đã gộp `d86f1c07`); `openapi.yaml` (`listRoomStatuses`, `transitionRoomStatus`, `RoomStatusEntry`, `createGuestRequest`, `updateOnlineCheckin`, changelog 0.3.12 (i)); máy chủ `stay.service.ts` (B14), `room-status.service.ts`, `housekeeping.service.ts` + `rules.ts`, `occupancy.service.ts`, `guest-requests.service.ts`, `guest-portal.service.ts`, `shared/sensitive-number.ts`; mock MSW admin-web và guest-web; `SEC-on-plan-v1.0.4.md` mục 4; `BE-D-P4-14.md`; thẻ FB-R4-ARC-FE-P432-03.
- Đọc thêm các commit lên `main` trong lúc review (không lặp lại thẻ của họ, chỉ dẫn chiếu):
  - `SEC-on-fe-prs-98-102-107.md` (`f719d46d`), thẻ FB-R5-SEC-BE-V546-01 (Major), SEC-PO-V546-02, SEC-FE-V546-03;
  - ORC `40519a5e`: phần máy chủ V5-46 giao **BE-A1**;
  - PO `d1d2fb8e`: tách backlog PR24PM-01 thành (a) lõi và (b) `guest-portal`; plan V5-46 thêm làn BE-A1, PR `r5-v5-46-server`;
  - `UXD-on-fe-prs-98-102-107.md` (`057ddb02`), thẻ PR98-01, PR102-01 (nhãn nút "Báo cần dọn").
- Đã chạy (worktree tách rời ở scratchpad, cài phụ thuộc offline, không chạm nhánh PR, không cần stack):

| Bản thử | Lệnh | Kết quả |
|---|---|---|
| `main` + #98 | admin-web `tsc --noEmit`; `vitest run` | sạch; 89 tệp / 998 ca qua (gồm 4 ca V5-50 và tệp `r3-v100-fea` đã sửa) |
| `main` + #102 | admin-web `tsc`, `vitest run`; api-client `tsc`, `vitest run` | sạch; 89 / 998 qua; api-client 3 tệp / 38 ca qua, **gồm `generated.test.ts`** (kiểu sinh khớp `openapi.yaml`) |
| `main` + #102 + #98 | gỡ xung đột tệp chữ (giữ cả hai nhóm, chạy lại `gen_strings.py`); admin-web `tsc`, `vitest run` | sạch; 90 / 1 002 qua |
| `main` + #107 | guest-web `tsc`, `vitest run` | sạch; 10 tệp / 99 ca qua |

E2E không chạy ở máy (không dựng stack). Kết quả E2E lấy từ CI (mục 5).

## 0. Kết luận

| PR | Kết luận ARC | Điều kiện gộp |
|---|---|---|
| **#98 V5-50** | **ĐẠT CÓ ĐIỀU KIỆN** | Sửa FB-R5-ARC-FE-98-01 (phiên API hết hạn trong E2E khi đổi giờ ảo); CI xanh cả job E2E; gỡ xung đột chữ với #102 theo FB-R5-ARC-FE-MRG-01 |
| **#102 V5-15 nút Cần dọn** | **ĐẠT CÓ ĐIỀU KIỆN** | Sửa FB-R5-ARC-FE-102-01 (E2E đỏ: 401); sửa mock theo FB-R5-ARC-FE-102-02; gỡ trùng khóa với #97 (MRG-01; nhãn theo UXD PR102-01). `packages/api-client` **không lệch** kiểu sinh |
| **#107 V5-46** | **ĐẠT** phần FE (CI xanh đủ 9 job, gộp được) | **V5-46 chưa xong**: máy chủ `guest-portal` chưa trả `ID_NUMBER_DETECTED`. Đã có thẻ SEC (Major) và ORC đã giao BE-A1; ARC đồng ý, bổ sung kỹ thuật ở thẻ FB-R5-ARC-BE-V546-01. Hai thẻ Minor 107-01, 107-02 |

- Không có Blocker. Major: 98-01, 102-01 (đều ở E2E). Phạm vi V5-46 phía máy chủ là Major của SEC (FB-R5-SEC-BE-V546-01), ARC không mở Major trùng.
- Cả ba PR đúng hợp đồng 0.3.13: không sửa `openapi.yaml`, không sửa tệp sinh, không thêm trường.
- Không lộ dữ liệu:
  - ảnh chụp dùng dữ liệu mock (tên trong seed, số CCCD giả `079000000000`);
  - câu báo không nhắc lại chữ khách gõ;
  - guest-web không ghi log, không lưu ghi chú bị chặn.
- **Câu hỏi PR24PM-01: chưa.** `main` (kiểm ở `ab1fc4ae`; từ đó tới `cf3b8cb0` không đổi mã máy chủ, chỉ đổi tài liệu) chưa trả `ID_NUMBER_DETECTED` cho `createGuestRequest.note` và `updateOnlineCheckin.arrivalNote`. Chi tiết, việc BE còn thiếu và làn làm ở mục 3.2.

---

## 1. PR #98 – V5-50: hộp Đổi phòng chỉ liệt kê căn VI/VC

### 1.1 Đối chiếu hợp đồng 0.3.13 mục 1.12 – đúng
- `ChangeRoomForm` gọi thêm `listRoomStatuses` (FD+ có quyền S10) và giữ căn `VI`/`VC`. Không thêm trường vào `AvailabilityResult`.
- Tập "sẵn sàng" của FE khớp máy chủ.
  - B14 chặn bằng `roomStatus.of(tx, newRoom.id, ctx.today)` và `status !== 'VI' && status !== 'VC'` → 409 `ROOM_NOT_READY` (`stay.service.ts` dòng 920, 943–944).
  - `listRoomStatuses` đọc cùng hàm `RoomStatusService.current` (OOO từ `room_block` đang hiệu lực, không có dòng thì OC/VC suy ra). Riêng BR-805 hiện `VI` quá hạn thành `VC` lúc đọc. Cả hai vẫn nằm trong tập cho phép, nên không có ca Desk hiện mà máy chủ chặn vì lệch cách đọc.
- Máy chủ vẫn chặn khi trạng thái đổi giữa chừng (BR-803). Desk không tự quyết thay máy chủ.

### 1.2 Giả định của FE – ARC đồng ý cả hai
- **Căn không có trong `listRoomStatuses` coi như chưa sẵn sàng.** Đây là cách đóng an toàn (fail-closed).
  - `listRoomStatuses` và B14 cùng chỉ thấy căn đang hoạt động (`roomRows`: `active_from`/`active_to` theo ngày nghiệp vụ).
  - Căn có trong `searchAvailability` mà không có trong `listRoomStatuses` chỉ xảy ra khi lệch khoảng hoạt động. Khi đó B14 cũng không đổi được sang căn đó.
- **Ngày áp dụng luôn là ngày nghiệp vụ hôm nay.**
  - Desk luôn gửi `effectiveDate: today` (`useBusinessDay`, BUG-R2-211).
  - Máy chủ luôn kiểm trạng thái của `ctx.today`.
  - Vì vậy lọc theo trạng thái hiện tại đúng với điều kiện "khi ngày áp dụng là hôm nay" của mục 1.12.
- Đọc trạng thái lỗi thì không lọc và có câu báo thật (`room_change.ready_unfiltered`). Đúng tinh thần: không chặn lễ tân vì một lệnh đọc phụ, máy chủ vẫn là chốt cuối.

### 1.3 Test
- Vitest 4 ca:
  - lọc 7 trạng thái;
  - mọi căn trống còn bẩn → câu "Không còn căn…";
  - chọn căn VC → `newRoomId` đúng;
  - đọc trạng thái 500 → danh sách không lọc và câu đúng.
- Mock B14 (`mocks/stay.ts` dòng 2488–2490) giữ luật 409 `ROOM_NOT_READY` như máy chủ. Mock `room-statuses` (`ops.ts`) bỏ căn `isSellable === false`, gần đúng `roomRows`.
- E2E `ui-clock/v5-50-change-room.r5.spec.ts` dựng ca bằng dữ liệu thật: B14 làm căn 202 thành VD mà vẫn trống, và kiểm `searchAvailability` vẫn trả 202. Cách dựng tốt, nhưng xem thẻ 98-01.

### FB-R5-ARC-FE-98-01
- Mức độ: **Major** (điều kiện gộp: CI xanh cả E2E).
- Vị trí: `product/tests/e2e/ui-clock/v5-50-change-room.r5.spec.ts`. Phiên `fd` lấy lúc 14:00 giờ ảo (`sessionOrSkip(request, 'qa.fd')`), rồi dùng sau `at(request, D, '15:00')` cho `stayAction(... 'change-room' ..., { dryRun: true })` và B14 thật.
- Vấn đề:
  - Phiên Desk hết hạn khi rảnh **30 phút theo giờ máy chủ** (`session_policy.admin.idleMinutes = 30`). Trên stack E2E, giờ máy chủ là giờ ảo.
  - Nhảy 14:00 → 15:00 làm phiên `fd` cũ trả **401**.
  - Bằng chứng: #102 dùng đúng mẫu này (14:00 → 16:00) và CI đã đỏ với 401 ở cả hai lượt chạy (thẻ 102-01).
  - Job E2E của #98 chưa chạy vì job unit đỏ do một test BE không liên quan (mục 5). Vì vậy đây là **dự báo có căn cứ**. Nếu job E2E xanh khi chạy lại thì đóng thẻ.
- Vì sao quan trọng: ca E2E duy nhất của V5-50 chạy trên máy chủ thật sẽ đỏ hoặc bị bỏ qua. QA không có bằng chứng tự động để đóng BUG-R3-023 phần lọc.
- Đề xuất sửa: sau **mỗi** `at(...)`, lấy lại phiên rồi mới gọi API, như `an-rates.s5.spec.ts` dòng 191–192 và 239–240:
  ```ts
  await at(request, D, '15:00');
  const fd15 = await sessionOrSkip(request, 'qa.fd');
  // dùng fd15 cho stayAction dryRun và B14
  ```
  Trang Desk lúc 16:00 đã tự đăng nhập mới (`desk(browser, 'qa.fd', now)`), không cần đổi.
- Trạng thái: Open (FE-A)

### FB-R5-ARC-FE-98-02
- Mức độ: Minor (nên làm cùng lần sửa 98-01; không chặn gộp nếu FE hết thời gian, khi đó dời v1.0.6).
- Vị trí: `StayDialogs.tsx` `ChangeRoomForm`, biến `suggested` và nhánh lỗi 409 `ROOM_NOT_READY`.
- Vấn đề:
  1. Gợi ý căn trong 409 `ROOM_UNAVAILABLE` không đi qua bộ lọc mới.
     - Máy chủ tạo gợi ý bằng `occupancy.suggest`, hàm này không xét trạng thái buồng (`occupancy.service.ts` dòng 227–250).
     - Vì vậy nút "Dùng căn X" có thể đưa ra căn VD. Bấm vào thì bản xem trước trả 409 `ROOM_NOT_READY`.
     - Câu dưới danh sách lại nói "Chỉ hiện căn VI/VC".
  2. Sau 409 `ROOM_NOT_READY` (căn vừa bẩn giữa chừng), danh sách không đọc lại trạng thái (G2 của FE: đóng rồi mở lại hộp). Căn vừa bị chặn vẫn nằm trong danh sách.
- Vì sao quan trọng: lễ tân bấm vào căn mà màn hình vừa nói là sẵn sàng, rồi nhận lỗi. Không sai tiền, chỉ mất một vòng thao tác.
- Đề xuất sửa:
  - lọc `suggested` bằng cùng tập `ready` khi đã có trạng thái (`unfiltered || ready.has(x.roomId)`);
  - khi `act.code === 'ROOM_NOT_READY'`, gọi `statuses.reload()`;
  - thêm 1 ca vitest cho mỗi ý.
- Trạng thái: Open (FE-A)

### FB-R5-ARC-FE-98-03
- Mức độ: Suggestion.
- Vị trí: `ChangeRoomForm` (lời gọi `listRoomStatuses`) và ca đầu của `v5-50-change-room-ready-fea.test.tsx`.
- Vấn đề: mock `availability` trong ca đầu trả căn `OOO` là `available: true`. Máy chủ không bao giờ trả như vậy, vì khóa phòng nằm trong `room_occupancy` (kind `ooo`). Ca này ngoài phạm vi máy chủ (P432-03), dù vô hại vì chỉ làm test chặt hơn.
- Ghi chú về `filter=ready`:
  - Máy chủ có `listRoomStatuses?filter=ready`, trả đúng `VI`/`VC` sau BR-805.
  - ARC **không** đề nghị dùng: thẻ UXD PR98-01 cần biết căn trống nào đang `VD`/`CL` để hiện câu `room_change.no_rooms_not_ready`, nên hộp phải tải đủ trạng thái (`filter=all`) như FE đang làm.
  - Danh sách `READY_FOR_MOVE` của FE khớp `matchesFilter('ready')` của máy chủ. Khi làm PR98-01, giữ một hằng duy nhất cho cả bộ lọc lẫn câu mới.
- Đề xuất: ca OOO ghi chú "ca phòng thủ, máy chủ không trả", hoặc thay bằng căn VD/CL. Nếu làm PR98-01 trong #98 thì ca VD + CL của UXD thay luôn được ca này.
- Trạng thái: Open (FE-A tự cân nhắc)

---

## 2. PR #102 – V5-15: nút Cần dọn trên Desk

### 2.1 Đối chiếu hợp đồng 0.3.13 mục 1.4 – đúng
- Nút chỉ hiện khi `RoomStatusEntry.allowedEvents` có `needs_cleaning`. Desk không tự suy quyền hay trạng thái, đúng EP07 2.1 ("computed by the server, never by the client").
- Thân lệnh `{ event: 'needs_cleaning', expectedFrom: <trạng thái đang hiện>, performedAt }` có Idempotency-Key, không gửi If-Match. Đúng mô tả `transitionRoomStatus`.
- 409 `INVALID_TRANSITION` → tải lại danh sách và hiện câu UXD `error.INVALID_TRANSITION_generic_reloaded`. Đối chiếu `copy-v1.0.5.md` dòng 444: nguyên văn.
- Mất mạng thì tắt nút (Desk không có hàng đợi offline), hợp lý.
- Ca T15-8 phần Desk có cả unit lẫn E2E.

### 2.2 `packages/api-client` – không lệch kiểu sinh, không sửa hợp đồng
- `types.ts`: `TransitionRoomStatusBody = BodyOf<'transitionRoomStatus'>` lấy từ `operations` của `generated/openapi.ts`, không tự viết lại kiểu. Kiểu trả về `RoomStatusEntry = Schemas['RoomStatusEntry']` có sẵn.
- `endpoints.ts`: `POST /v1/properties/{propertyId}/rooms/{roomId}/status-transitions`, khớp đường và phương thức trong `openapi.yaml`. `idempotencyKey` bắt buộc, khớp tham số `IdempotencyKey` của op. Đây là lớp bọc viết tay theo đúng mẫu của mọi op khác trong `endpoints.ts`, không phải tệp sinh.
- `generated/openapi.ts` không đổi. `generated.test.ts` (tệp đã commit = `generate()` từ `openapi.yaml`) qua trên bản gộp với `main` có hợp đồng 0.3.13.
- Ghi chú: app nhân viên giữ lời gọi riêng trong `apps/mobile/src/app/api.ts` (đi qua hàng đợi offline). Hai chỗ gọi cùng op, cùng kiểu sinh. Không cần gộp ở v1.0.5.

### FB-R5-ARC-FE-102-01
- Mức độ: **Major** (điều kiện gộp: CI đang đỏ).
- Vị trí: `product/tests/e2e/ui-clock/v5-15-needs-cleaning.r5.spec.ts` dòng 96–102 (GET `hk-tasks` với `session: fd`) và lệnh R8 qua API ở lượt 2.
- Vấn đề:
  - CI run `42251128926`, job "docker images build · E2E smoke": ca V5-15 đỏ cả 2 lượt, `Expected: 200, Received: 401` ở dòng 102.
  - Phiên `fd` lấy lúc 14:00 giờ ảo, dùng sau `at(request, D, '16:00')`. Phiên Desk hết hạn khi rảnh 30 phút theo giờ máy chủ (cùng nguyên nhân thẻ 98-01).
  - Phần giao diện của ca đã qua: nút, R8 200, toast, OD đều đúng. Chỉ phần kiểm bằng API sau khi nhảy giờ hỏng.
- Vì sao quan trọng: CI đỏ là chặn gộp (DoD). Lượt 2 (409 khi căn đã đổi) cũng dùng `fd` cũ, nên cũng sẽ 401 khi dòng 102 được sửa.
- Đề xuất sửa: ngay sau `const now = await at(request, D, '16:00')`, gọi `const fd16 = await sessionOrSkip(request, 'qa.fd')` và dùng `fd16` cho GET `hk-tasks` và lệnh R8 qua API. Chạy lại job E2E.
- Trạng thái: Open (FE-A)

### FB-R5-ARC-FE-102-02
- Mức độ: Minor (P432-03: mock đúng phạm vi máy chủ).
- Vị trí: `product/apps/admin-web/src/mocks/ops.ts`, `POST …/status-transitions` (R8a) và `roomEntry` (`allowedEvents`).
- Vấn đề:
  1. **R8a**:
     - Mock chỉ tạo việc `stayover_clean` khi căn **chưa có việc `stayover_clean` nào ngày hôm nay, ở bất kỳ trạng thái nào**.
     - Máy chủ tạo việc khi căn **không có việc `stayover_clean` đang mở hoặc đang làm**. Xem `housekeeping.service.ts` dòng 449–451 và 512–522: `roomTasks` lọc `open`/`in_progress`; chỉ mục duy nhất `hk_task_clean_uk` cũng chỉ áp cho `open`/`in_progress`.
     - Ca lệch: sáng đã dọn ở lại (`done`), chiều khách xin dọn nữa. Máy chủ tạo việc mới, mock thì không.
  2. **Phạm vi T**: mock trả sự kiện cho `housekeeping` ở mọi căn. Máy chủ chỉ trả trong phạm vi T với HK-only (`allowedEvents(..., { inScope })`). Desk hiện không phục vụ HK-only nên chưa có hậu quả, nhưng mock rộng hơn máy chủ.
- Vì sao quan trọng: test đơn vị không bao giờ thấy ca "dọn lần hai trong ngày". Đây là đúng loại lệch P432-03 đã yêu cầu tránh.
- Đề xuất sửa:
  - đổi điều kiện R8a thành "không có `stayover_clean` `open`/`in_progress` của căn";
  - thêm 1 ca vitest: việc dọn ở lại sáng nay `done` → bấm Cần dọn → có việc mới;
  - `roomEntry`: HK-only chỉ có sự kiện khi căn trong phạm vi (hoặc ghi chú rõ mock không mô phỏng phạm vi T).
- Trạng thái: Open (FE-A)

### FB-R5-ARC-FE-102-03
- Mức độ: Suggestion (v1.0.6).
- Vị trí: `HousekeepingPage.tsx` `RoomRow.needsCleaning` (`performedAt: new Date().toISOString()`). Cùng mẫu với hai lệnh việc buồng phòng có sẵn ở dòng 168, 294.
- Vấn đề:
  - Máy chủ kiểm `performedAt` trong [giờ máy chủ − 24 giờ, + 5 phút] và không trước thao tác cuối của căn quá 5 phút (`rules.ts` `performedAtInRange`, `performedBefore`). Nếu sai → 422 `PERFORMED_AT_OUT_OF_RANGE`.
  - Desk chưa có câu cho mã này, nên `act.view()` hiện câu chung. Chỉ xảy ra khi đồng hồ máy quầy lệch quá 5 phút.
- Đề xuất: UXD viết một câu cho `PERFORMED_AT_OUT_OF_RANGE` trên Desk ("giờ trên máy quầy đang lệch, hãy chỉnh giờ máy rồi thử lại"), dùng chung cho ba nút của trang.
- Trạng thái: Open (FE-A, UXD)

---

## 3. PR #107 – V5-46 guest-web, và câu hỏi PR24PM-01

### 3.1 Phần FE – đúng hợp đồng
- `sensitiveNumberOf()` đọc cả mã cấp trên lẫn mã trường (thẻ trước, giấy tờ sau, theo thứ tự `sensitiveNumberKind` của máy chủ). Nhờ vậy guest-web chịu được hai dạng máy chủ đang dùng:
  - thẻ: 422 `code: CARD_NUMBER_DETECTED`;
  - giấy tờ: 422 `VALIDATION_FAILED` + `errors[{ field, code: ID_NUMBER_DETECTED }]`, theo ví dụ `idInNote` của hợp đồng.
- Đúng điều kiện SEC-on-plan-v1.0.4 mục 4.2:
  - ý 5: câu báo ở ô `arrivalNote` (dưới ô, `role="alert"`, `aria-invalid`) và tab Yêu cầu;
  - không tự dò số giấy tờ trên máy khách;
  - không lưu chữ, không nhắc lại chữ khách gõ.
- Khóa `error.ID_NUMBER_DETECTED` là khóa đã duyệt (CPY lượt 2), có đủ VI/EN/RU. Không sửa `gen_strings.py`.
- **Sửa kèm có giá trị – đây là lỗi đang có trên production:**
  - Máy chủ trả số thẻ trong lời nhắn yêu cầu bằng mã cấp trên `CARD_NUMBER_DETECTED` (`guest-requests.service.ts` dòng 391–394).
  - `RequestsPage.tsx` trên `main` chỉ đọc mã trường khi mã cấp trên là `VALIDATION_FAILED` (dòng 351), nên rơi xuống câu `gw.error_server` ("lỗi máy chủ, mã …").
  - Trang này không chặn số thẻ trên máy khách, nên khách gõ số thẻ vào lời nhắn sẽ thấy "lỗi máy chủ".
  - Đề nghị QA ghi một mã lỗi (đề xuất P3: sai câu với khách, không lưu dữ liệu, không mất tiền) để release notes v1.0.5 nêu được.

### 3.2 Trả lời câu PR24PM-01: máy chủ guest-portal **chưa** trả `ID_NUMBER_DETECTED`

**Bằng chứng trên `main` @ `ab1fc4ae`:**
- `guest-requests.service.ts` `note()` (dòng 384–397): chỉ có `containsCardNumber(text)` → 422 `CARD_NUMBER_DETECTED`. Không gọi `sensitiveNumberKind` / `looksLikeIdNumber`.
- `guest-portal.service.ts` nhánh `arrivalNote` (dòng 552–566): chỉ có `containsCardNumber(note)` → 422 `CARD_NUMBER_DETECTED`.
- Trong `src/` (bỏ tệp test và tệp sinh), `ID_NUMBER_DETECTED` chỉ có ở `public-site`:
  - `website-requests.service.ts` dòng 656;
  - `public-booking.service.ts` dòng 529 và 540.
- Không có PR mở nào sửa hai hàm trên. PR-D1 #100 của BE-D không chạm `guest-portal` hay `sensitive-number.ts`.

**Vì sao backlog ghi "Xong v1.0.4":** dòng FB-R4-ARC-BE-PR24PM-01 (backlog dòng 1631) chỉ đúng với **phần lõi**:
- chuyển `sensitive-number.ts` sang `src/shared/`;
- `containsCardNumber` = luật cũ OR `looksLikeCard`;
- test kiến trúc.

Phần `guest-portal` (SEC 4.2 ý 2) chưa làm:
- `responses/BE-D-P4-14.md`: "Done (lõi). Phần `guest-portal` để sau".
- ORC 04/11: "`ID_NUMBER_DETECTED` ở guest-portal vẫn chờ SEC, không thì v1.0.5".
- `openapi.yaml` 0.3.12 (i): "không kịp thì phần này sang v1.0.5 và server chưa trả mã này".

**Trạng thái xử lý trên `main` (sau `ab1fc4ae`):**
- SEC (`f719d46d`) đã mở FB-R5-SEC-BE-V546-01 (Major), gồm cài đặt, điều kiện "không ghi gì", test và luật cùng tag. ARC không mở Major trùng.
- PO (`d1d2fb8e`) đã tách backlog PR24PM-01 thành (a) lõi Xong v1.0.4 và (b) `guest-portal` mở, thuộc V5-46.
- ORC (`40519a5e`) giao **BE-A1**, PR `r5-v5-46-server`, làm sau PR-A1a và trước PR-A2, vì BE-D đã kín.
- **ARC đồng ý làn BE-A1.** Việc không đụng migration, không đổi hợp đồng, độc lập với PR-A1a. Bộ dò ở `shared/` đã xong, BE-A1 chỉ gọi hàm có sẵn. Phần kỹ thuật ARC bổ sung nằm ở thẻ dưới.

**Lỗi của ARC:** hợp đồng 0.3.13 mục 1.12 viết "Việc còn lại là của FE-B/MOB", và bảng làn mục 2 không có dòng BE cho V5-46. Câu đó sai: việc máy chủ vẫn còn. ARC sửa ở bản bổ sung chữ kế tiếp (mục 6).

### FB-R5-ARC-BE-V546-01
- Mức độ: Minor. Đây là bổ sung kỹ thuật cho FB-R5-SEC-BE-V546-01 (Major của SEC), không mở Major trùng. Không chặn gộp #107.
- Vị trí:
  - `product/services/api/src/modules/guest-portal/internal/guest-requests.service.ts` `note()` (dòng 384–397);
  - `product/services/api/src/modules/guest-portal/internal/guest-portal.service.ts` nhánh `arrivalNote` của `update` (dòng 552–566).
- Vấn đề: SEC đã nêu cái cần làm. Còn ba chi tiết dễ làm sai khi cài:
  1. **Nhánh thẻ có thể bị thu hẹp.**
     - Mẫu ở `website-requests.service.ts` dòng 654–656 chỉ dùng `sensitiveNumberKind(text)`.
     - Nửa thẻ của hàm đó chỉ là `looksLikeCard`.
     - Cổng khách hiện dùng `containsCardNumber` = luật V-09 cũ OR `looksLikeCard` (`shared/validation.ts` dòng 42–44), rộng hơn.
     - Chép nguyên mẫu website sang thì một số chuỗi số thẻ đang bị chặn sẽ lọt qua. Đó là hồi quy, trái SEC ý 3.
  2. **Dạng mã thẻ.** Máy chủ đang trả mã cấp trên `CARD_NUMBER_DETECTED`, và guest-web (#107) đọc được cả hai dạng. Đổi dạng lúc này không mang lại gì, chỉ thêm rủi ro.
  3. **Bộ đếm ghi SR-RL-05.**
     - `countWrite` (dòng 507) tăng `write_count` trước khi kiểm ghi chú.
     - `withContext` hủy cả giao dịch khi ném lỗi (`db/database.ts` dòng 126–131), nên lần bị chặn không lưu gì và không tính vào hạn mức. Nhánh thẻ hiện nay cũng vậy.
     - Test "không đổi `online_checkin`" của SEC phải kiểm cả `write_count`.
- Vì sao quan trọng: làm đúng SEC nhưng thu hẹp nhánh thẻ thì V5-46 xong mà bảo vệ số thẻ ở cổng khách lại yếu đi.
- Đề xuất sửa (làn **BE-A1**, PR `r5-v5-46-server` cắt từ `main`, theo ORC `40519a5e`):
  - Thứ tự kiểm ở cả hai ô:
    - giữ nguyên `containsCardNumber(text)` đứng trước, cùng dạng lỗi hiện có;
    - sau đó mới `looksLikeIdNumber(text)` → giấy tờ;
    - như vậy "vừa thẻ vừa giống giấy tờ → `CARD_NUMBER_DETECTED`" (SEC ý 4) tự đúng.
  - `note()`: `throw fieldError('note', 'ID_NUMBER_DETECTED')` (helper sẵn có ở dòng 121). Kết quả là 422 `VALIDATION_FAILED`, `errors[{ field: 'note', code: 'ID_NUMBER_DETECTED' }]`, đúng ví dụ `idInNote`. `note()` chạy ở dòng 277, trước `INSERT guest_request` (dòng 305), nên không có việc HK hay phiếu MT nào được tạo.
  - `arrivalNote`:
    - `errors.push({ field: 'arrivalNote', code: 'ID_NUMBER_DETECTED' })`, không gọi `set('arrival_note', …)`;
    - hàm đã ném `VALIDATION_FAILED` ở dòng 576, trước `UPDATE` (dòng 578) và `audit.record` (dòng 583), nên cả lệnh bị bỏ (SEC ý 2).
  - Chỉ gọi hàm có sẵn của `shared/sensitive-number.ts`. Muốn sửa bộ dò thì làm PR riêng, có BE-D (người giữ bộ dò) và SEC review.
  - Không đổi `openapi.yaml`: hợp đồng 0.3.12 (i) đã có mã và ví dụ. Câu chữ `CARD_NUMBER_DETECTED` ở `createGuestRequest` là việc chữ của ARC trong danh sách 0.3.14 (mục 6), không đổi hành vi ở v1.0.5.
  - Test, ngoài các ca SEC ý 4 và các ca **không** chặn (số phòng, `VN 1234`, giờ, ngày, số tiền có đơn vị, SĐT `+84`):
    - 1 ca hồi quy: chuỗi thẻ chỉ luật cũ bắt được vẫn bị chặn ở cả hai ô;
    - 1 ca E2E API cho mỗi op.
  - Nên bỏ `page.route` trong cùng PR (thẻ 107-02). Dùng hằng `079000000000` (SEC-FE-V546-03), và FE-B review tệp spec đó. Plan V5-46 ghi việc này cho QA; làm trong PR máy chủ thì CI chứng minh luôn phần máy chủ.
  - Review: SEC (giữ điều kiện), ARC, QA.
  - Luật gộp:
    - #107 gộp trước;
    - `r5-v5-46-server` chỉ gộp khi #107 đã có trên `main`, và phải nằm trong cùng `SHA_V105`;
    - lỡ hạn cắt thì theo SEC ý 6 và plan V5-46 (Deferred có hạn, release notes không nêu).
  - DATA/OPS (V5-07): sau PR này, số 422 `ID_NUMBER_DETECTED` có thêm hai op. Báo cáo tuần nên tách theo op.
- Trạng thái: Open (BE-A1)

### FB-R5-ARC-FE-107-01
- Mức độ: Minor (P432-03).
- Vị trí: `product/apps/guest-web/src/mocks/handlers.ts`:
  - `PUT /v1/guest/online-checkin`, nhánh thẻ (dòng ~322);
  - `POST /v1/guest/requests`, nhánh thẻ (dòng ~533);
  - kịch bản `requestFail: 'CARD_NUMBER_DETECTED'`.
- Vấn đề:
  - Mock trả số thẻ bằng mã cấp trên `VALIDATION_FAILED`. Máy chủ thật trả mã cấp trên `CARD_NUMBER_DETECTED` (`guest-requests.service.ts` dòng 392, `guest-portal.service.ts` dòng 560). Chính lệch này đã giấu lỗi ở mục 3.1 suốt từ trước tới nay.
  - Nhánh `arrivalNote` của mock còn gộp "dài hơn 300" vào mã thẻ. Máy chủ trả `TOO_LONG`.
  - FE đã thêm một ca dùng `server.use` với dạng thật, nhưng mock gốc vẫn lệch. Các ca khác vẫn chạy trên dạng sai.
- Vì sao quan trọng: mock lệch máy chủ thì test đơn vị không bắt được lỗi dạng phản hồi.
- Đề xuất sửa:
  - đổi hai nhánh thẻ của mock sang `problem(422, 'CARD_NUMBER_DETECTED', { errors: [{ field, code: 'CARD_NUMBER_DETECTED' }] })`;
  - tách `TOO_LONG` cho `arrivalNote` > 300;
  - nhánh giấy tờ giữ dạng `VALIDATION_FAILED` + mã trường (theo `idInNote`);
  - chạy lại vitest guest-web. `sensitiveNumberOf` đọc cả hai dạng nên các ca hiện có vẫn phải xanh.
- Trạng thái: Open (FE-B)

### FB-R5-ARC-FE-107-02
- Mức độ: Minor (gắn với thẻ BE-V546-01).
- Vị trí: `product/tests/e2e/ui/v5-46-guest-id-number.r5.spec.ts`, `refuseNote()` + `page.route`.
- Vấn đề:
  - Lệnh có số giấy tờ bị `page.route` chặn và trả ví dụ hợp đồng. Số không tới máy chủ.
  - Cách này đúng lúc máy chủ chưa có. Nhưng sau khi `r5-v5-46-server` gộp, ca vẫn xanh dù máy chủ có trả mã hay không, nên không chứng minh được phần máy chủ.
- Đề xuất:
  - bỏ `page.route` trong `r5-v5-46-server` (BE-A1 sửa tệp test, FE-B review) hoặc QA bỏ ngay sau khi PR đó gộp;
  - giữ `axe` và các bước còn lại;
  - QA chỉ đóng V5-46 khi ca này chạy với máy chủ thật.
- Trạng thái: Open (BE-A1 hoặc QA, theo plan V5-46)

---

## 4. Gộp và xung đột

### FB-R5-ARC-FE-MRG-01
- Mức độ: Minor (phối hợp FE-A, MOB; ORC xếp thứ tự gộp).
- Vị trí: tệp chữ sinh, gồm `gen_strings.py`, `strings-vi.json`, `strings-en.json`, `strings-tables.md`, `wireframes/assets/strings.js`.
- Vấn đề (đã thử bằng `git merge-tree`):
  - Mỗi PR #98, #102, #107 gộp sạch vào `main` khi đứng riêng.
  - **#98 ↔ #102** xung đột ở cả 5 tệp chữ: cả hai thêm nhóm mới sau `co.minibar_cabinet_saved`, và `strings.js` là một dòng.
  - **#102 ↔ #97 (MOB V5-15)** cùng thêm khóa `hk.action.needs_cleaning` ngay sau `hk.action.finish_cleaning`. Chữ VI/EN giống nhau, ghi chú khác nhau, nên `gen_strings.py`, `strings-tables.md`, `strings.js` xung đột.
- Vì sao quan trọng: gỡ sai thì sinh hai dòng cùng khóa, hoặc tệp sinh lệch `gen_strings.py` (CI có bước "`gen_strings.py` không lệch").
- Đề xuất:
  - PR gộp sau rebase lên `main`;
  - với `gen_strings.py`: giữ cả hai nhóm, mỗi nhóm đóng bằng `])`;
  - với `hk.action.needs_cleaning`:
    - chỉ giữ **một** dòng, ghi chú ghép hai nơi dùng (Desk S10, app nhân viên H20);
    - chữ theo UXD PR102-01: VI "Báo cần dọn", EN "Mark for cleaning";
    - PR nào gộp sau thì lấy dòng của `main` (UXD mục 2.1);
  - `error.INVALID_TRANSITION_generic_reloaded` của #102 cũng có trong Gói 2 (UXD mục 2.1): PR gộp sau bỏ dòng trùng;
  - lấy tệp sinh của `main` rồi chạy lại `python3 product/design/tools/gen_strings.py`;
  - chạy lại vitest admin-web và mobile.
  - ARC đã thử gỡ `main` + #102 + #98 theo cách này: 3 487 khóa, admin-web 90 tệp / 1 002 ca qua.
  - Thứ tự đề xuất: #107 bất kỳ lúc nào (không chạm tệp chữ) → #102 (sau khi sửa 102-01) → #98 rebase → #97 rebase. ORC đổi được.
- Trạng thái: Open (FE-A, MOB, ORC)

## 5. CI (đọc lúc 06/11 khoảng 23:58)

| PR | Run | Kết quả |
|---|---|---|
| #98 @ `1efe60c7` | `42253253953` | 8 job xanh. **"format · lint · audit · test · build" đỏ** ở test BE `test/integration/registration-flow.test.ts:688` (BUG-R2-036 / BR-609-01: `t01Images` mong ≥ 1, nhận 0). #98 không chạm BE. Cùng test xanh ở run của #102 và #107 trên cùng gốc, nên coi là chập chờn: chạy lại job. Job E2E bị bỏ qua vì phụ thuộc job này, nên ca V5-50 chưa chạy (thẻ 98-01). QA nên ghi test chập chờn này |
| #102 @ `71db3338` | `42251128926` | 8 job xanh. **E2E đỏ**: `v5-15-needs-cleaning.r5.spec.ts` 401 cả hai lượt (thẻ 102-01). `debt-collect.s5.spec.ts` TC-X-081 chập chờn (qua ở lượt lại), không liên quan |
| #107 @ `e2ffd228` | `42253441905` | **Xanh cả 9 job**, gồm E2E (16 phút 28 giây; ca `ui/v5-46-guest-id-number.r5.spec.ts` chạy trên stack thật, phần bị chặn qua `page.route` – thẻ 107-02) |

## 6. Việc của ARC (tự nhận)
- Sửa hợp đồng 0.3.13 mục 1.12 ý V5-46: "máy chủ `guest-portal` chưa trả mã; BE-A1 làm PR `r5-v5-46-server` (SEC FB-R5-SEC-BE-V546-01, thẻ ARC BE-V546-01); guest-web (#107) gộp trước". Thêm dòng BE-A1 `r5-v5-46-server` vào bảng làn mục 2.
- Chỉ sửa chữ, không đổi schema. #104 (bổ sung 1e) đã được SEC duyệt gộp (`cf3b8cb0`), nên ARC làm ở bổ sung 1f, không đẩy thêm vào #104. Không đẩy vào nhánh FE.
- Nhận việc PO ghi vào danh sách 0.3.14 (`d1d2fb8e`): thống nhất câu chữ `CARD_NUMBER_DETECTED` ở `createGuestRequest`.
  - Hướng ARC: ghi đúng hành vi đang chạy, tức mã cấp trên 422 kèm `errors[{ field, code }]`.
  - Không đổi máy chủ cho khớp chữ cũ.

## 7. Dòng decision-log đề nghị (ORC ghi khi chốt)
```
| 2026-11-06 | 5 | ARC review FE #98 (V5-50), #102 (V5-15 nút Cần dọn), #107 (V5-46) – rounds/round-05/reviews/ARC-on-fe-prs-98-102-107.md: #98 ĐẠT CÓ ĐK (98-01 Major: lấy lại phiên sau khi đổi giờ ảo trong E2E; CI chạy lại); #102 ĐẠT CÓ ĐK (102-01 Major: E2E 401, 102-02 Minor mock R8a/phạm vi T); #107 ĐẠT phần FE. api-client của #102 không lệch kiểu sinh. Xung đột chữ #98↔#102↔#97 gỡ theo MRG-01 | ARC | Đúng hợp đồng 0.3.13 1.4, 1.12; không đổi openapi.yaml |
| 2026-11-06 | 5 | V5-46: ARC xác nhận máy chủ guest-portal chưa trả ID_NUMBER_DETECTED trên main (như SEC f719d46d). ARC đồng ý làn BE-A1 PR r5-v5-46-server (ORC 40519a5e). Thẻ FB-R5-ARC-BE-V546-01 (Minor, bổ sung SEC): giữ containsCardNumber đứng trước rồi mới looksLikeIdNumber (không chép mẫu website, tránh thu hẹp nhánh thẻ); không đổi dạng mã thẻ ở v1.0.5; test kiểm cả write_count. ARC sửa chữ 0.3.13 mục 1.12 và bảng làn ở bổ sung 1f | ARC | Không migration, không đổi openapi.yaml |
```

## 8. Điểm làm tốt
- #98 dựng ca E2E bằng dữ liệu thật và **tự kiểm điều kiện của ca**: `searchAvailability` vẫn trả căn VD. Nhờ vậy test không xanh nhầm khi máy chủ đổi. Nhánh "đọc trạng thái lỗi thì nói thật, không chặn" đúng tinh thần máy chủ là chốt cuối.
- #102 để máy chủ quyết nút qua `allowedEvents`. Kiểu api-client lấy từ kiểu sinh, không viết tay. Câu 409 dùng nguyên văn UXD thay vì câu "Đơn…" sai ngữ cảnh.
- #107 tìm ra lỗi production thật (số thẻ ở tab Yêu cầu hiện "lỗi máy chủ") nhờ đọc mã máy chủ thay vì tin mock. FE cũng ghi rõ "bật cùng tag máy chủ" thay vì coi V5-46 đã xong.

## 9. Giả định, ESC
- Giả định: thời gian rảnh của phiên Desk trên stack CI là mặc định 30 phút (`session_policy`, `openapi-meta.ts` dòng 3062). Lỗi 401 của #102 khớp với giả định này.
- Không có ESC mới: mọi điểm là kỹ thuật hoặc phân việc nội bộ, không phát sinh chi phí hay chính sách.
