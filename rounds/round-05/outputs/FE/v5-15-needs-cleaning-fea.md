# FE-A – v1.0.5 V5-15 `r5-fe-v5-15-clean`: nút Cần dọn trên Desk

- Người viết: FE-A | Round 5 – bước **Sản xuất** | 06/11/2026
- Nhánh: `r5-fe-v5-15-clean` cắt từ `origin/main` @ `6b5b8f34`. Không cần nhánh hợp đồng: `transitionRoomStatus` `needs_cleaning` và `RoomStatusEntry.allowedEvents` đã có trên `main` (OpenAPI 0.3.7). Không cần máy chủ của PR-A1b.
- Căn cứ: `rounds/round-05/plan.md` dòng V5-15; ARC 0.3.13 mục 1.4 ("Nút Cần dọn: không đổi hợp đồng… Nút Cần dọn của FE-A và MOB không chờ BE"), ca T15-8; mục 2 làn FE-A "Làm ngay".
- Phần "Trả phòng quá ngày đi" của V5-15 KHÔNG ở PR này: chờ PR-0 (#94) và PR-A1b (BE-A2).

## 1. Đã làm gì
- Desk → Buồng phòng → khối **Trạng thái buồng**: mỗi căn có nút **Cần dọn** khi máy chủ trả `needs_cleaning` trong `allowedEvents` (hiện là căn OC, vai FD+ và HK trong phạm vi). Desk không tự suy ra quyền hay trạng thái.
- Bấm → `transitionRoomStatus` `{ event: needs_cleaning, expectedFrom: <trạng thái đang hiện>, performedAt: giờ máy }` + Idempotency-Key. 200 → toast, tải lại danh sách căn và danh sách việc (máy chủ tạo việc "Dọn phòng khách đang ở" nếu căn chưa có – R8a).
- 409 `INVALID_TRANSITION` (căn đã đổi, ví dụ buồng phòng vừa bấm trên PWA) → tải lại danh sách và báo câu UXD `error.INVALID_TRANSITION_generic_reloaded`. Không dùng `error.INVALID_TRANSITION` vì câu đó nói về "Đơn".
- Mất mạng → nút tắt (Desk không có hàng đợi offline; PWA có).
- Nút có `aria-describedby` trỏ số căn, để trình đọc màn hình đọc "Cần dọn, 301".
- `@ottimo/api-client`: thêm `transitionRoomStatus` và kiểu `TransitionRoomStatusBody` (tay viết, đọc kiểu từ hợp đồng sinh sẵn; không sửa `openapi.yaml` hay tệp sinh).
- Mock MSW (`mocks/ops.ts`): `allowedEvents` tính như máy chủ (`rules.ts`), thêm `POST …/status-transitions` (R1, R2/R3, R8; 409 khi `expectedFrom` lệch).

## 2. Chữ (Desk nội bộ, chờ UXD duyệt)
| Khóa | VI | EN | Nguồn |
|---|---|---|---|
| `hk.action.needs_cleaning` | Cần dọn | Needs cleaning | Tên nút theo plan R5. Đặt cạnh `hk.action.start_cleaning`/`finish_cleaning` để app nhân viên (MOB) dùng chung khóa |
| `hk.desk.needs_cleaning_toast` | Căn {room} chuyển cần dọn và có việc dọn. | Room {room} needs cleaning and gets a cleaning task. | Cùng câu với `stay.change_effect_old` của UXD |
| `error.INVALID_TRANSITION_generic_reloaded` | Dữ liệu vừa thay đổi nên thao tác này không còn dùng được. Danh sách đã tải lại. | This just changed, so the action no longer applies. The list has been reloaded. | Nguyên văn UXD `copy-v1.0.5.md` mục 4.12. Làn Gói 2 không thêm lại |

## 3. Tệp
- Sửa: `product/apps/admin-web/src/pages/ops/HousekeepingPage.tsx`, `product/apps/admin-web/src/mocks/ops.ts`, `product/packages/api-client/src/endpoints.ts`, `types.ts`, `endpoints.test.ts`, `product/design/tools/gen_strings.py` + tệp sinh.
- Mới: `product/apps/admin-web/src/__tests__/v5-15-needs-cleaning-fea.test.tsx`, `product/tests/e2e/ui-clock/v5-15-needs-cleaning.r5.spec.ts`, ảnh `screenshots/v5-15-*.png`, báo cáo này.

## 4. Kiểm
- Vitest 4 ca: chỉ căn OC có nút (VI, VD, OD, OOO không có); bấm → đúng thân lệnh, khóa UUID, căn thành OD, nút mất, việc dọn ở lại hiện ở danh sách việc; 409 → câu "Danh sách đã tải lại", căn hiện OD, không còn câu "Đơn vừa chuyển"; mất mạng → nút tắt; vai Bảo trì không có nút.
- api-client: 1 ca (URL, Idempotency-Key, không If-Match).
- E2E desk-clock (API thật): nhận phòng 301 và 302 (OC); bấm Cần dọn 301 → 200, OD, có việc `stayover_clean`; 302 đổi qua API sau khi trang tải → bấm nút cũ → 409, câu UXD, căn hiện OD. Axe trước và sau.
- `tsc`, `eslint`, `prettier`, `gen_strings.py` không lệch, toàn bộ vitest admin-web xanh ở máy.

## 5. Giả định
- G1. Không hỏi xác nhận trước khi bấm: lệnh nhẹ, không đụng tiền; bấm nhầm thì hủy việc dọn ở danh sách việc. UXD quyết nếu cần hộp xác nhận.
- G2. Nút ở khối Trạng thái buồng của trang Buồng phòng, không thêm ở Sơ đồ phòng hay drawer đơn. UXD có thể đề nghị chỗ khác.

## 6. Cần xem
- UXD: ba câu ở mục 2, vị trí nút, có cần hộp xác nhận không. Câu `checkin.room_status_stuck` (BUG-R4-039) có ghi chú "v1.0.5 có nút Cần dọn thì UXD đổi câu" – việc của UXD.
- MOB: dùng chung `hk.action.needs_cleaning` cho app nhân viên, không thêm khóa thứ hai.
- QA: T15-8 phần Desk trên staging.
