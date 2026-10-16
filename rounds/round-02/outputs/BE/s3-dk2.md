# BE-A – Round 2, Sprint 3: ĐK-S2-2 (QC-S2-01 / BUG-R2-025) – nối `ROOM_CAPACITY_CHECK` vào bảng đơn

- Vai: BE (BE-A) | Ngày: 16/10/2026 | Không commit (ORC commit) | DB test riêng `ottimo_test_bea`
- Nguồn: `rounds/round-02/qc/s2-qc-gate.md` (QC-S2-01, ĐK-S2-2); BR-110; EP00 mục `maxOccupancy`; OpenAPI `updateRoom` 409 (0.3.5, không sửa `docs/api` – ARC đang viết 0.3.6)

## 1. Đã làm gì
| Việc | Nội dung |
|---|---|
| Cài thật cổng | `reservations/public/room-capacity-check.ts` – `ReservationCapacityCheck`. Một đơn chặn việc hạ `maxOccupancy` xuống `newMax` khi: trạng thái `confirmed`, `in_house`, hoặc `hold` còn hạn (`hold_expires_at > now`); có **segment đang hoạt động** trên căn còn đêm ≥ hôm nay (`to_date > today`, nửa mở BR-002); **người lớn + trẻ 6–11 > newMax** (trẻ dưới 6 không tính – BR-110). Mỗi đơn một dòng `conflicts[]` (`reservationCode`, `stayFrom`/`stayTo` = khoảng ở trên căn này, `guestCount`), xếp theo ngày đến |
| Nối module | `ReservationsModule` (global) cung cấp + export `ROOM_CAPACITY_CHECK` (`useExisting`). `PlatformModule` **bỏ** provider stub; `NO_BOOKINGS_YET` bị xóa khỏi `platform/public/room-capacity.ts` → thiếu provider thì Nest báo lỗi lúc khởi động, không còn "im lặng cho qua" như QC-S2-01. Sửa comment sai ở `reservations.module.ts:5` (K9 lệch truy vết) |
| Chống đua (race) | `RoomsService.update` đã khóa dòng `room` FOR UPDATE trước khi kiểm, nhưng chỉ thấy đơn đã commit. Bên ghi đơn đọc `max_occupancy` **trước** khi khóa căn (thứ tự khóa đơn → căn). Thêm `ReservationsService.assertCapacityStable()`: sau `lockRooms`, đọc lại `max_occupancy`; nếu đã đổi → `409 CONCURRENT_UPDATE` + `Retry-After: 1` (client thử lại, lần sau đi đúng nhánh `CAPACITY_EXCEEDED`/cảnh báo). Áp cho: tạo đơn, tạo giữ chỗ, `move`, `assignRoom`, `swapRoom`, `restoreNoShow` (khi đổi căn). `PATCH /reservations/{id}` đổi số khách: khóa căn **trước** khi đọc sức chứa (đơn đã khóa sẵn – giữ đúng thứ tự khóa) |
| Không migration | Đủ cột/chỉ mục sẵn có (`reservation_segment.room_id`, `reservation.status`); `drizzle-kit generate`: No schema changes |

## 2. File tạo/sửa
| File | Loại |
|---|---|
| `product/services/api/src/modules/reservations/public/room-capacity-check.ts` | mới |
| `product/services/api/src/modules/reservations/reservations.module.ts` | sửa (provider + export, comment) |
| `product/services/api/src/modules/platform/platform.module.ts` | sửa (bỏ stub – phần BE-B, đã báo ở mục 6) |
| `product/services/api/src/modules/platform/public/room-capacity.ts` | sửa (xóa `NO_BOOKINGS_YET`, cập nhật mô tả) |
| `product/services/api/src/modules/reservations/internal/reservations.service.ts` | sửa (`assertCapacityStable` + 6 chỗ gọi, khóa căn khi đổi số khách) |
| `product/services/api/test/room-capacity-check.test.ts` | mới – 4 ca đơn vị |
| `product/services/api/test/integration/room-capacity.test.ts` | mới – 8 ca tích hợp |
| `product/tests/e2e/api/room-capacity.api.spec.ts` | mới – 1 ca E2E API (QA gán mã TC) |

## 3. Test mới
**Tích hợp** (`room-capacity.test.ts`, PostgreSQL thật, chạy 8 lần liên tiếp đều xanh):
1. Đơn `confirmed` tương lai 5 khách ở 301 → hạ 5→4: `409 CAPACITY_BELOW_BOOKINGS`, `conflicts[]` đúng mã/ngày/số khách, căn không đổi (version giữ nguyên); MGR nhận cùng kết quả.
2. 302: 3 NL + 1 trẻ 8 tuổi + 2 trẻ dưới 6 → tính 4 → hạ xuống 3 bị chặn; 401: 4 NL + 2 trẻ dưới 6 → hạ xuống 4 **được** (bằng max mới là hợp lệ); tăng lại không kiểm.
3. Nhiều đơn: mỗi đơn một dòng, xếp theo ngày đến; đơn vừa sức chứa mới không bị liệt kê.
4. Đơn đã hủy không chặn; đơn có đêm cuối = hôm nay vẫn chặn, sang ngày nghiệp vụ sau (đi = hôm nay) thì không chặn.
5. `in_house` chặn; `hold` còn hạn chặn; `hold` đã quá hạn (J1 chưa chạy) không chặn.
6. Đơn đã `move` sang căn khác: căn cũ hết bị chặn (segment không hoạt động), căn mới bị chặn.
7. Chống đua: đọc căn → giao dịch khác hạ `max_occupancy` và commit → khóa căn → `assertCapacityStable` ném `CONCURRENT_UPDATE`; không đổi thì không ném.
8. Đồng thời thật qua HTTP: quản lý hạ 3→2 cùng lúc lễ tân nâng số khách 2→3 → sau cùng **không bao giờ** có số khách > sức chứa; bên thua nhận `CAPACITY_BELOW_BOOKINGS` / `CAPACITY_EXCEEDED` / `CONCURRENT_UPDATE`.

**Đơn vị** (`room-capacity-check.test.ts`): tham số truy vấn (căn, max mới, ngày nghiệp vụ, giờ đồng hồ hệ thống – không dùng `now()` của DB để MutableClock áp được), ánh xạ dòng → `conflicts[]`, quy tắc trong SQL (không có `children_under_6`), platform không còn stub.

**E2E API** (`room-capacity.api.spec.ts`, project `api`): đặt 301 với 4 NL + 1 trẻ 6–11 + 1 trẻ dưới 6 (tính 5) ở khoảng trống → `PATCH maxOccupancy: 4` → 409 kèm conflict của đơn đó, căn giữ 5. An toàn trên stack dùng chung: nếu server sai mà lưu được, `finally` trả lại sức chứa. **Chưa chạy trên stack** – stack `dev`/`qa-s3` đang dùng image build trước bản sửa và đang được vai khác dùng nên BE-A không build lại. QA chạy sau khi OPS/QA build lại image (`tsc` + eslint + prettier của file đã sạch).

## 4. Kết quả lệnh (16/10/2026, DB `ottimo_test_bea`)
| Lệnh | Kết quả |
|---|---|
| `turbo run test --force` | **12/12 xanh**; api **34 file / 1165 ca** (thêm 12) ; admin-web 108 |
| `pnpm build` | 6/6 |
| `node scripts/gen-openapi-meta.mjs --check` | up to date |
| `drizzle-kit generate` | No schema changes |
| `turbo run typecheck` | 11/12 – **đỏ ở `@ottimo/tests`** do `tests/e2e/ui/a11y.axe.spec.ts` (QA đang làm ĐK-S2-4, file tạo vài phút trước – kiểu `@axe-core/playwright`). File của BE-A sạch |
| `pnpm lint` (eslint) | 6 lỗi ở `tests/e2e/ui/rack-booking.smoke.spec.ts` (biến chưa dùng – QA đang sửa). Bỏ thư mục `tests/e2e/ui/` thì 0 lỗi (1 warning sẵn có `mockServiceWorker.js`) |
| `pnpm format:check` | 2 file chưa format: `tests/e2e/ui/a11y.axe.spec.ts`, `tests/e2e/ui/rack-booking.smoke.spec.ts` (QA đang làm). Mọi file khác xanh |

BE-A **không sửa** các file `tests/e2e/ui/*` vì QA đang ghi đồng thời; nhờ ORC nhắc QA chạy `prettier --write` + sửa trước khi commit bước này.

## 5. Giả định (tự quyết theo quyền BE – đề nghị ORC ghi decision-log)
- **"Đơn tương lai/đang ở"** = `confirmed`, `in_house`, `hold` còn hạn, có đêm trên căn ≥ ngày nghiệp vụ (theo mô tả 409 của OpenAPI). Đơn `in_house` quá ngày đi mà chưa trả phòng (không còn đêm ≥ hôm nay) **không** tính – trường hợp hiếm, night audit R3 xử lý.
- Đơn OTA đã mang cờ "sức chứa" (vượt sẵn) **vẫn tính** là xung đột: hạ thêm chỉ làm tệ hơn.
- `stayFrom`/`stayTo` là khoảng ở **trên căn đang sửa** (segment), không phải cả đơn – đơn đổi căn giữa kỳ chỉ hiện phần đêm bị ảnh hưởng.
- Bên ghi đơn thua đua với `updateRoom` nhận `409 CONCURRENT_UPDATE` (mã đã có từ 0.3.5, FE xử lý theo ĐK-S2-3) thay vì tự tính lại nhánh sức chứa – đơn giản, đúng, client thử lại là ra nhánh chuẩn.

## 6. Rủi ro / phối hợp
| Với | Nội dung |
|---|---|
| ARC (OpenAPI 0.3.6) | Phần thứ hai của ĐK-S2-2 – **cảnh báo "{n} đơn tương lai vẫn giữ căn này" khi bật ngừng bán** (EP00 dòng `isSellable`) – **chưa có trường trong hợp đồng** (`Room`/`updateRoom` 200 không có `warnings`/số đơn). Đề nghị ARC thêm vào 0.3.6, ví dụ `Room.futureReservationCount` (readOnly, chỉ trả ở `updateRoom`) hoặc `warnings[{code: 'FUTURE_RESERVATIONS_KEEP_ROOM', count}]`. BE-A cài trong ~0,5 ngày khi ARC chốt (truy vấn dùng lại điều kiện của `OVER_CAPACITY_SQL` bỏ vế số khách). Không tự thêm trường để không lệch contract test |
| BE-B | Đã sửa `platform.module.ts` + `platform/public/room-capacity.ts` (phần của BE-B): chỉ bỏ stub, không đổi `RoomsService`. BE-B xem lại giúp |
| QA | (1) Gán mã TC cho ca E2E mới, thêm vào ma trận truy vết; chạy khi image mới lên. (2) Đóng BUG-R2-025 sau khi E2E xanh trên CI. (3) Sửa format/lint/typecheck `tests/e2e/ui/*` (mục 4) |
| FE/UXD | Chuỗi `error.CAPACITY_BELOW_BOOKINGS` ("Không giảm được: {n} đơn…") đã có trong đặc tả; FE hiện danh sách `conflicts[]` ở form sửa căn (S25) – kiểm lại khi có API thật |

## 7. Việc chưa xong
- Cảnh báo ngừng bán (chờ ARC – mục 6).
- E2E chưa chạy trên stack (chờ build lại image).
