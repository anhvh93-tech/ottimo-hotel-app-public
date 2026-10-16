# QA – Phản hồi thẻ review, Round 2

- Tác giả: QA | Ngày: 16/10/2026 (Đợt 0) | Không commit (theo chỉ đạo ORC)

## Thẻ từ BE (`reviews/BE-on-QA.md`)

### FB-R2-BE-QA-01 (Major) – mã nhóm `GRP-`, tên `docType`/`periodKey` lệch erd mục 10
- Trả lời: **Accepted – Fixed** (ghi lỗi QA tự nhận BUG-R2-004, P2, Closed).
- Đã sửa `product/tests/fixtures/seed/ds-e.json` khối `docSequences` đúng như đề xuất:
  - `group` / `GRP-` → `reservation_group` / `NH-` (`NH-{n:05}`, BR-007 v0.3, erd mục 10; `HH-` dành cho nhóm hộ CRM R3 – chưa có bảng nên DS-E không seed bộ đếm `household`).
  - `receipt` → `payment` (`PT-{n:06}`).
  - `periodKey` `all` → `-` cho 6 bộ đếm; `bill` giữ `year`.
  - Ghi chú `docSequencesNote` nêu nguồn erd 10 + số thẻ.
- Chống tái phát: `product/tests/tools/validate-fixtures.mjs` kiểm `docSequences` theo bảng erd 10 (tên, tiền tố, độ dài, `periodKey`). Thử đột biến `NH-` → `GRP-`, `payment` → `receipt`: 2 lỗi, exit 1.
- Kiểm chứng: `pnpm --filter @ottimo/api seed:ds-e` trên DB dev `ottimo`, **không** `--allow-code-drift` → exit 0, 7/7 mã khớp (`NH-00001`, `PT-000001` …), `aliases` [], `warnings` [].
- Việc của BE (sau thẻ này, không chặn QA):
  1. Bỏ bảng ánh xạ tạm `DOC_TYPE_ALIASES` như BE đã nêu.
  2. `services/api/test/integration/seed.test.ts` đang dựa vào fixture cũ, sẽ **đỏ 3 ca** khi chạy với DB test: ca 1 mong `aliases` = `['group → reservation_group', 'receipt → payment']` (nay []), ca 2 "stops on a code mismatch (fixture GRP- …)" (fixture thật nay khớp → không ném lỗi), ca 3 mong cảnh báo `GRP-00001`. Đề nghị: tạo lệch bằng `fixture((x) => …prefix = 'GRP-')` trong test thay vì dựa vào file thật; ca 1 mong `aliases` [].
  3. Thiết bị: fixture vẫn ghi `devices[].type` = `property_tablet` (loader ánh xạ sang `facility_mobile`, erd 2.x/OpenAPI `deviceKind`). Thẻ không yêu cầu đổi; nếu đổi bây giờ loader dừng (`DEVICE_KINDS` không có khóa `facility_mobile`). QA sẽ đổi sang `facility_mobile` khi BE cho `DEVICE_KINDS` nhận cả tên erd – báo QA một dòng là đổi được.

## Việc kèm theo (ORC giao, không phải thẻ)
- `baseOccupancy` khớp OpenAPI 0.3.1: `rooms[].baseOccupancy` (Studio 2; 301, 401 = 4; 302, 402 = 3) và `maxOccupancy` = định mức + 1 đã có trong DS-E từ Đợt 0 lượt trước. Lượt này: `roomGroups[]` đổi `defaultBaseOccupancy`/`defaultMaxOccupancy` → `baseOccupancy`/`maxOccupancy` theo schema `RoomGroup` 0.3.1; DS-0 thêm khối `roomOccupancy` (bảng tra 10 căn, kế thừa DS-E, không nạp lại) và validator kiểm bảng này khớp DS-E.
