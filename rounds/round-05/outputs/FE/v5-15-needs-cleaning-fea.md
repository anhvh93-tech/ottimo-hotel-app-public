# FE-A – v1.0.5 V5-15 `r5-fe-v5-15-clean`: nút Báo cần dọn trên Desk

- Người viết: FE-A | Round 5 – bước **Sản xuất** | 06/11/2026
- Nhánh: `r5-fe-v5-15-clean` cắt từ `origin/main` @ `6b5b8f34`. Không cần nhánh hợp đồng: `transitionRoomStatus` `needs_cleaning` và `RoomStatusEntry.allowedEvents` đã có trên `main` (OpenAPI 0.3.7). Không cần máy chủ của PR-A1b.
- Căn cứ: `rounds/round-05/plan.md` dòng V5-15; ARC 0.3.13 mục 1.4 ("Nút Cần dọn: không đổi hợp đồng… Nút Cần dọn của FE-A và MOB không chờ BE"), ca T15-8; mục 2 làn FE-A "Làm ngay".
- Phần "Trả phòng quá ngày đi" của V5-15 KHÔNG ở PR này: chờ PR-0 (#94) và PR-A1b (BE-A2).

## 1. Đã làm gì
- Desk → Buồng phòng → khối **Trạng thái buồng**: mỗi căn có nút **Báo cần dọn** (đổi chữ theo UXD, mục 7) khi máy chủ trả `needs_cleaning` trong `allowedEvents` (hiện là căn OC, vai FD+ và HK trong phạm vi). Desk không tự suy ra quyền hay trạng thái.
- Bấm → `transitionRoomStatus` `{ event: needs_cleaning, expectedFrom: <trạng thái đang hiện>, performedAt: giờ máy }` + Idempotency-Key. 200 → toast, tải lại danh sách căn và danh sách việc (máy chủ tạo việc "Dọn phòng khách đang ở" nếu căn chưa có – R8a).
- 409 `INVALID_TRANSITION` (căn đã đổi, ví dụ buồng phòng vừa bấm trên PWA) → tải lại danh sách và báo câu UXD `error.INVALID_TRANSITION_generic_reloaded`. Không dùng `error.INVALID_TRANSITION` vì câu đó nói về "Đơn".
- Mất mạng → nút tắt (Desk không có hàng đợi offline; PWA có).
- Nút có `aria-describedby` trỏ số căn, để trình đọc màn hình đọc "Báo cần dọn, 301".
- `@ottimo/api-client`: thêm `transitionRoomStatus` và kiểu `TransitionRoomStatusBody` (tay viết, đọc kiểu từ hợp đồng sinh sẵn; không sửa `openapi.yaml` hay tệp sinh).
- Mock MSW (`mocks/ops.ts`): `allowedEvents` tính như máy chủ (`rules.ts`), thêm `POST …/status-transitions` (R1, R2/R3, R8; 409 khi `expectedFrom` lệch).

## 2. Chữ (Desk nội bộ, UXD duyệt 06/11)
| Khóa | VI | EN | Nguồn |
|---|---|---|---|
| `hk.action.needs_cleaning` | Báo cần dọn | Mark for cleaning | UXD đổi chữ (FB-R5-UXD-FE-PR102-01, copy-v1.0.5 9.7). Bản đầu "Cần dọn" / "Needs cleaning" theo plan. Đặt cạnh `hk.action.start_cleaning`/`finish_cleaning` để app nhân viên (MOB) dùng chung khóa |
| `hk.desk.needs_cleaning_toast` | Căn {room} chuyển cần dọn và có việc dọn. | Room {room} needs cleaning and gets a cleaning task. | Cùng câu với `stay.change_effect_old` của UXD |
| `error.INVALID_TRANSITION_generic_reloaded` | Dữ liệu vừa thay đổi nên thao tác này không còn dùng được. Danh sách đã tải lại. | This just changed, so the action no longer applies. The list has been reloaded. | Nguyên văn UXD `copy-v1.0.5.md` mục 4.12. Làn Gói 2 không thêm lại |

## 3. Tệp
- Sửa: `product/apps/admin-web/src/pages/ops/HousekeepingPage.tsx`, `product/apps/admin-web/src/mocks/ops.ts`, `product/packages/api-client/src/endpoints.ts`, `types.ts`, `endpoints.test.ts`, `product/design/tools/gen_strings.py` + tệp sinh.
- Mới: `product/apps/admin-web/src/__tests__/v5-15-needs-cleaning-fea.test.tsx`, `product/tests/e2e/ui-clock/v5-15-needs-cleaning.r5.spec.ts`, ảnh `screenshots/v5-15-*.png`, báo cáo này.

## 4. Kiểm
- Vitest 4 ca: chỉ căn OC có nút (VI, VD, OD, OOO không có); bấm → đúng thân lệnh, khóa UUID, căn thành OD, nút mất, việc dọn ở lại hiện ở danh sách việc; 409 → câu "Danh sách đã tải lại", căn hiện OD, không còn câu "Đơn vừa chuyển"; mất mạng → nút tắt; vai Bảo trì không có nút.
- api-client: 1 ca (URL, Idempotency-Key, không If-Match).
- E2E desk-clock (API thật): nhận phòng 301 và 302 (OC); bấm Báo cần dọn 301 → 200, OD, có việc `stayover_clean`; 302 đổi qua API sau khi trang tải → bấm nút cũ → 409, câu UXD, căn hiện OD. Axe trước và sau.
- `tsc`, `eslint`, `prettier`, `gen_strings.py` không lệch, toàn bộ vitest admin-web xanh ở máy.

## 5. Giả định
- G1. Không hỏi xác nhận trước khi bấm: lệnh nhẹ, không đụng tiền; bấm nhầm thì hủy việc dọn ở danh sách việc. UXD quyết nếu cần hộp xác nhận.
- G2. Nút ở khối Trạng thái buồng của trang Buồng phòng, không thêm ở Sơ đồ phòng hay drawer đơn. UXD có thể đề nghị chỗ khác.

## 6. Cần xem
- UXD: ba câu ở mục 2, vị trí nút, có cần hộp xác nhận không. Câu `checkin.room_status_stuck` (BUG-R4-039) có ghi chú "v1.0.5 có nút Cần dọn thì UXD đổi câu" – việc của UXD.
- MOB: dùng chung `hk.action.needs_cleaning` cho app nhân viên, không thêm khóa thứ hai.
- QA: T15-8 phần Desk trên staging.

## 7. Phản hồi & sửa (UXD-on-fe-prs-98-102-107, 06/11)
Trả lời đủ thẻ ở `rounds/round-05/responses/FE-responses.md`.
- **PR102-01 (Major, điều kiện gộp)**: `hk.action.needs_cleaning` đổi thành "Báo cần dọn" / "Mark for cleaning", giữ tên khóa. Ghi chú khóa và tên nhóm đổi sang "UXD duyệt 06/11". Test lấy chữ bằng `tv()`, E2E bằng chuỗi sinh, nên không phải sửa chỗ tìm nút; chỉ sửa chú thích.
- **PR102-02 (Minor)**: câu mới `checkin.room_status_stuck` (OC, chỉ tới nút Báo cần dọn) và khóa mới `checkin.room_status_stuck_od` (OD, nhờ buồng phòng dọn), nguyên văn copy-v1.0.5 9.7. `roomBlockedMessage` (`CheckInPage.tsx`): `cause = room_status` + `detail = OD` → `_od`, OC giữ khóa cũ. Test `bug-r4-039-fea.test.tsx`: ca OD nay chờ câu `_od`, ca OC kiểm câu có nhãn nút, bảng chọn câu cập nhật.
- **PR102-03 (Minor)**: nút trong dòng căn cao 44 px khi màn ≤ 520 px (lớp `room-acts`, `packages/ui/src/styles/app.css`). Đo trên mock: 1366 px → 32 px, 390 px → 44 px.
- **PR102-04 (Suggestion)**: chưa làm, để v1.0.6 (ORC không giao trong lượt này).
- **Ảnh đã đổi** (chụp lại trên mock, dữ liệu giả): `v5-15-needs-cleaning-1366-before.png`, `-1366-after.png`, `-390-before.png` – nhãn nút mới, nút 44 px ở 390.
- **Trùng khóa với MOB #97**: `hk.action.needs_cleaning` cũng có ở #97, cùng chữ mới. PR nào gộp sau thì bỏ dòng trùng trong `gen_strings.py`.
- Kiểm: toàn bộ vitest admin-web 998/998 xanh, `tsc`, `eslint`, `prettier`, `gen_strings.py` sinh lại không lệch.

## 8. Phản hồi & sửa (ARC-on-fe-prs-98-102-107, 07/11)
- **102-01 (Major, điều kiện gộp)**: E2E `ui-clock/v5-15-needs-cleaning.r5.spec.ts` lấy phiên mới `fd16 = sessionOrSkip(request, 'qa.fd')` ngay sau `at(request, D, '16:00')` và dùng nó cho GET `hk-tasks` và lệnh R8 qua API ở lượt 2. Phiên lấy lúc 14:00 giờ ảo hết hạn khi rảnh 30 phút theo giờ máy chủ, nên trả 401 (CI 42251128926).
- **102-02 (Minor)**: mock `mocks/ops.ts`:
  - R8a chỉ tạo việc `stayover_clean` khi căn **không có** việc `stayover_clean` `open`/`in_progress` (như `housekeeping.service.ts`). Việc dọn ở lại sáng đã `done` không chặn việc mới.
  - Phạm vi T: hàm `inScope` theo `scopeRooms` của máy chủ (việc của ngày nghiệp vụ hoặc việc mở chuyển sang, khác `cancelled`, chưa giao hoặc giao cho người gọi). HK-only ngoài phạm vi: `allowedEvents` rỗng, lệnh trạng thái trả 404. Người có vai lễ tân thấy mọi căn.
  - 2 ca vitest mới: sáng đã dọn xong → bấm Báo cần dọn → có việc mới; việc đang mở → không thêm việc thứ hai. Desk không phục vụ HK-only nên phạm vi T chỉ kiểm qua mã mock, không có ca giao diện.
- 102-03 (Suggestion, câu `PERFORMED_AT_OUT_OF_RANGE`): v1.0.6, cần UXD viết câu.
- Ảnh: không đổi trong lượt này.
- Kiểm: vitest admin-web 1000/1000, `tsc` (admin-web, tests), `eslint`, `prettier`.

