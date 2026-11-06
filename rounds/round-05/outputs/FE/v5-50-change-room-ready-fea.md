# FE-A – v1.0.5 V5-50 `r5-fe-v5-50`: hộp Đổi phòng lọc bỏ căn chưa dọn (BUG-R3-023 phần lọc, P2)

- Người viết: FE-A | Round 5 – bước **Sản xuất** | 06/11/2026
- Nhánh: `r5-fe-v5-50` cắt từ `origin/main` @ `6b5b8f34`. Không đổi hợp đồng (ARC 0.3.13 mục 1.12, mục 2 "Làm ngay").
- Căn cứ: `rounds/round-05/plan.md` dòng V5-50; ARC 0.3.13 mục 1.12; BR-803; thẻ UXD FB-R3-UXD-FE-A-17 (round 3).

## 1. Đã làm gì
- `StayDialogs.tsx` (`ChangeRoomForm`, B14): đọc thêm `listRoomStatuses` (FD+ đã có quyền) và chỉ giữ căn **VI / VC** trong danh sách "Căn mới". `searchAvailability` không có trạng thái buồng, nên trước đây căn VD/CL vẫn hiện; chọn căn đó thì máy chủ trả 409 `ROOM_NOT_READY`.
- B14 luôn áp từ ngày nghiệp vụ, nên lọc theo trạng thái hiện tại luôn đúng ("ngày áp dụng là hôm nay" của ARC).
- Danh sách chỉ hiện khi đã có cả hai kết quả (không nháy danh sách chưa lọc).
- Không tải được trạng thái buồng: danh sách giữ như cũ, câu dưới danh sách nói thật là danh sách có thể còn căn chưa dọn. Máy chủ vẫn chặn 409 `ROOM_NOT_READY`.
- Gợi ý căn trống trong lỗi 409 `ROOM_UNAVAILABLE` vẫn lấy từ máy chủ, không lọc thêm.
- Không gọi API mới, không thêm trường, không sửa `openapi.yaml`, không sửa mock máy chủ.

## 2. Chữ (Desk nội bộ, không phải chữ cho khách)
| Khóa | Kiểu | VI | Nguồn |
|---|---|---|---|
| `room_change.ready_only` | Sửa | Chỉ hiện căn VI · Đã kiểm, sẵn sàng hoặc VC · Đã dọn, chờ kiểm, và không bị khóa. | Câu "khi đã lọc" UXD viết sẵn ở FB-R3-UXD-FE-A-17 (VI + EN) |
| `room_change.ready_unfiltered` | Mới | (nguyên văn câu v1.0.0 của `room_change.ready_only`) | Cùng thẻ UXD, dùng lại cho ca chưa tải được trạng thái buồng |

Không tự viết câu mới. UXD xem lại: ca lỗi có cần câu riêng không, và bảng `content-guide.md` dòng 731 (vẫn là câu cũ hơn nữa, thuộc UXD).

## 3. Tệp
- Sửa: `product/apps/admin-web/src/pages/stay/StayDialogs.tsx`; `product/apps/admin-web/src/__tests__/r3-v100-fea.test.tsx` (ca nhãn nhóm BUG-R3-023 đặt căn trống thành VI trước khi mở hộp); `product/design/tools/gen_strings.py` + tệp sinh (`strings-vi/en.json`, `strings.js`, `strings-tables.md`).
- Mới: `product/apps/admin-web/src/__tests__/v5-50-change-room-ready-fea.test.tsx`, `product/tests/e2e/ui-clock/v5-50-change-room.r5.spec.ts`, báo cáo này.

## 4. Kiểm
- Vitest `v5-50-change-room-ready-fea` 4 ca: `searchAvailability` trả 7 căn trống (VI, VC, VD, CL, OC, OD, OOO) → chỉ hiện VI, VC và câu mới; mọi căn trống còn bẩn → câu "Không còn căn sẵn sàng…", không có ô chọn; chọn căn VC → B14 gửi đúng `newRoomId`; `room-statuses` lỗi 500 → danh sách chưa lọc + câu `ready_unfiltered`.
- E2E (desk-clock, API thật): khách A ở 201, khách B ở 202 đổi sang 203 bằng B14 → 202 thành VD mà vẫn trống. Mở Đổi phòng của A: `searchAvailability` có 202, hộp không có 202 và 203, có 101 (VC); câu mới hiện; axe 0 critical/serious. Không bấm lưu.
- `tsc` (admin-web, tests), `eslint`, `prettier`, `gen_strings.py` không lệch; toàn bộ vitest admin-web xanh.

## 5. Giả định
- G1. Căn không có trong `listRoomStatuses` (không bán, ngừng hoạt động) coi như chưa sẵn sàng, không hiện.
- G2. Không tự tải lại trạng thái khi hộp đang mở: căn vừa dọn xong thì mở lại hộp. Máy chủ vẫn chặn khi trạng thái đổi giữa chừng.

## 6. Cần xem
- UXD: hai câu ở mục 2; hộp ở 1366 và 390 (ảnh trong PR).
- QA: đóng phần lọc của BUG-R3-023 sau khi lên staging (chọn căn VD không còn trong danh sách).
