# Danh sách lỗi – Round 2

- Tác giả: QA | Mở: 16/10/2026 (tuần 1, Đợt 0) | Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8
- Lỗi tồn từ R1: `rounds/round-01/qa/bug-list.md` (không chép lại)

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed | Closed |
|---|---|---|---|---|
| P0 | 0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 | 0 |
| P2 | 2 | 0 | 1 | 1 |
| P3 | 2 | 0 | 2 | 0 |
| **Tổng** | **4** | **0** | **3** | **1** |

| ID | Mức | Tóm tắt | Vai sửa | Trạng thái |
|---|---|---|---|---|
| BUG-R2-001 | P2 | BR v0.2 chưa đổi mặc định theo INV đã quyết (ân hạn trả muộn 12:30 – ESC-007 A; ở tối thiểu bật – ESC-004 A) | DOM | Fixed (BR v0.3) |
| BUG-R2-002 | P3 | Ví dụ BR-321 và BR-803 dùng căn 204 – OTTIMO không có căn 204 | DOM | Fixed (BR v0.3) |
| BUG-R2-003 | P3 | Ví dụ BR-433 gọi "nhận sớm trước 06:00" là phí 1.042.000, trái BR-411/417 v0.2 (đó là đêm bán) | DOM | Fixed (BR v0.3) |
| BUG-R2-004 | P2 | Seed DS-E: bộ đếm nhóm đơn `GRP-` (đúng: `NH-`), tên `docType`/`periodKey` lệch erd mục 10 → `pnpm seed:ds-e` dừng (FB-R2-BE-QA-01) | QA | Closed (16/10) |

## 2. Chi tiết

### BUG-R2-001 – BR v0.2 chưa đổi mặc định theo quyết định INV 16/10
- Mức: **P2** (tài liệu nguồn con số lệch quyết định đã chốt; code theo BR sẽ thu sai tiền trả muộn) · Môi trường: tài liệu · Vai sửa: DOM (plan R2 mục 2, việc DOM (4)) · Trạng thái: **Fixed** (BR v0.3, 16/10)
- Bước tái hiện: so `02-escalations/escalations-index.md` (ESC-007 "A – ân hạn 12:30…", ESC-004 "A – bộ chính sách giá khuyến nghị", gồm M-A ở tối thiểu 2 đêm cho đến T6, T7, ngày lễ) với `product/docs/business-rules.md` mục 13.
- Thực tế: `late_grace_until` = 12:00 (không ân hạn); `min_stay[]` = 1 đêm (tắt). BR vẫn ghi "INV chọn ở ESC-007".
- Mong đợi: BR v0.3 đổi mặc định (`late_grace_until` 12:30; `min_stay` theo M-A) hoặc ghi rõ R2 vẫn dùng mặc định cũ và lý do.
- Bằng chứng: `product/tests/fixtures/br-examples.json` dòng BR-412-08, BR-412-09, BR-113-01 (trường `escNote`); `fixtures/seed/ds-e.json` tham số `late_grace_until`, `min_stay` (trường `note`). Ví dụ: trả 12:20, căn không có khách đến → theo INV 0 đ, theo BR hiện hành 210.000 đ.
- Khi DOM sửa: QA đổi giá trị seed DS-E và chạy lại `pnpm test:fixtures`.

### BUG-R2-002 – Ví dụ BR-321 và BR-803 dùng căn 204 không tồn tại
- Mức: P3 · Vai sửa: DOM · Trạng thái: **Fixed** (BR v0.3, 16/10)
- Thực tế: BR-321 "203 hết, gợi ý 204"; BR-803 "Đổi phòng khách đang ở sang 204 đang VD → chặn". BL 4.1 chỉ có 101–103, 201–203, 301, 302, 401, 402.
- Mong đợi: ví dụ dùng căn có thật (vd. BR-321: nhóm Lầu 1–2 hết → gợi ý nâng hạng 301 cho lễ tân trưởng xác nhận theo BR-316; BR-803: 202 đang VD).
- Bằng chứng: oracle BR-321-01, BR-803-02 (trường `issue`) – QA ghi kỳ vọng không phụ thuộc số căn.

### BUG-R2-003 – Ví dụ BR-433 trái BR-411/417 v0.2
- Mức: P3 · Vai sửa: DOM · Trạng thái: **Fixed** (BR v0.3, 16/10)
- Thực tế: BR-433 ví dụ "nhận sớm trước 06:00 phí 1.042.000: cần quản lý". Từ v0.2, BR-411 ghi "trước 06:00 không phải phụ thu" và BR-417 xử lý là đêm bán (doanh thu phòng); miễn tiền đêm này là "giảm giá đặc biệt" (BR-431), không phải FOC phụ thu.
- Mong đợi: đổi ví dụ sang khoản phát sinh thật vượt 300.000 (vd. trả muộn 17:00 căn 401: 50% × 1.042.000 = 521.000 → cần quản lý).
- Bằng chứng: oracle BR-433-02 (trường `issue`).

### BUG-R2-004 – Seed DS-E ghi mã nhóm đơn `GRP-`, tên bộ đếm lệch erd mục 10
- Mức: **P2** (seed là hợp đồng mã giữa DB, TC và E2E; loader dừng nên không nạp được DS-E nếu không dùng `--allow-code-drift`) · Môi trường: dev, PostgreSQL 17 `ottimo` (Docker `ottimo-dev-postgres-1`), loader `services/api/src/db/seed/ds-e.ts` · Vai sửa: QA (chủ fixture) · Nguồn: thẻ FB-R2-BE-QA-01 (BE) · Trạng thái: **Closed** (QA tự chạy lại 16/10)
- Bước tái hiện: DB đã migrate, chưa có tổ chức `OTTIMO` → `pnpm --filter @ottimo/api seed:ds-e` (không cờ).
- Thực tế (trước sửa): `SeedCodeMismatchError: … group: server NH-00001 ≠ fixture GRP-00001`, exit 1; báo cáo có `aliases` `group → reservation_group`, `receipt → payment`.
- Mong đợi: fixture theo BR-007 v0.3 / erd mục 10: `reservation_group` `NH-{n:05}` (`HH-` dành cho nhóm hộ CRM R3), `payment` `PT-{n:06}`, `periodKey` `-` (bill giữ `year`); loader chạy qua, 7/7 mã khớp, `aliases` rỗng.
- Bằng chứng sau sửa: xem mục 3 dòng BUG-R2-004.

## 3. Kiểm lại bản sửa (QA, 16/10/2026 – Đợt 0)

Cách kiểm: đọc `product/docs/business-rules.md` **v0.3.1** (cột ví dụ + mục 13), cập nhật oracle/seed theo `rounds/round-02/outputs/DOM/w1-oracle-review.md`, chạy `node product/tests/tools/validate-fixtures.mjs` → **0 lỗi** (226 dòng oracle, 157 dòng tự tính lại). Chuyển **Fixed**; chuyển **Closed** khi test unit của BE (sprint 1) đọc oracle mới và xanh – tầng code chưa có nên chưa kiểm được ở tầng A.

| ID | Bằng chứng đã sửa trong BR v0.3 | Oracle/seed QA đã đổi | Trạng thái |
|---|---|---|---|
| BUG-R2-001 | Mục 13: `late_grace_until` = **12:30** (INV-007), `min_stay[]` **bật** 2 đêm cho ngày đến T6/T7/ngày đặc biệt (INV-004), thêm `min_stay_orphan_night_exception`; BR-412 ví dụ 12:20/12:30 → 0, 12:31 → 210.000 | BR-412-01…09 params 12:30 + điều kiện không có khách đến; BR-412-04 đổi `sameDayArrival` = true (giữ ca bậc 30%); thêm BR-412-10, -11; BR-113-01 bỏ `escNote`, thêm BR-113-02, -03; seed `late_grace_until`, `min_stay` | Fixed |
| BUG-R2-002 | BR-321: gợi ý căn trống cùng nhóm (ví dụ 101), hết nhóm → nâng hạng 301 cho FDL xác nhận; BR-803: đổi sang 202 đang VD | BR-321-01 bỏ `issue`, thêm `groupCodePattern`, `suggestedRooms`, `whenGroupFull`; BR-803-02 thêm `targetRoom` 202 | Fixed |
| BUG-R2-003 | BR-433: ví dụ mới trả muộn 17:00 căn 401 = 521.000 > 300.000 → cần quản lý; ghi rõ miễn đêm trước 06:00 là "giảm giá đặc biệt" | BR-433-02 đổi ca, bỏ `issue` | Fixed |
| BUG-R2-004 | `ds-e.json` `docSequences`: `group`/`GRP-` → `reservation_group`/`NH-`, `receipt` → `payment`, `periodKey` `all` → `-`; validator thêm kiểm `docSequences` theo erd 10 (đột biến `GRP-` + `receipt` → 2 lỗi, exit 1) | `pnpm --filter @ottimo/api seed:ds-e` trên DB dev `ottimo`, **không** `--allow-code-drift`: exit 0, 13 user, 15 vai, 2 thiết bị, 136 tham số, **7/7 mã khớp** (`OTM-00001, BG-00001, WO-00001, NH-00001, PT-000001, F26-000001, KH-0001`), `aliases` [], `warnings` [] | **Closed** |
