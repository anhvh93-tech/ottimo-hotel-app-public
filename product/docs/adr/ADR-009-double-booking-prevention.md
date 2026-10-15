# ADR-009 – Chống đặt trùng ở database (exclusion constraint) + idempotency

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: BL 8.2 #5, #30; BR-002, BR-301, BR-312, BR-804, BR-905, BR-906; PRD S1 (0 đặt trùng); tình huống S1, S5; plan QC C3

## Bối cảnh
- Prototype chỉ kiểm trùng ở client (BL 8.2 #30), OOO không chặn bán (#5). Đặt trùng là sự cố tệ nhất với khách OTA.
- Nguồn tạo/sửa chiếm phòng: đặt mới, giữ chỗ, gia hạn, đổi phòng, hợp đồng dài hạn, OOO, đơn OTA về từ channel manager, hết hạn giữ chỗ (giải phóng).
- 10 căn là **10 đơn vị riêng** (mỗi căn có tên, số); OTA bán theo nhóm căn, Airbnb bán từng căn.

## Quyết định
1. **Một bảng chiếm phòng duy nhất** `room_occupancy` (tên chốt ở ERD Pha B): mỗi dòng = một căn × khoảng ngày `[from, to)` × loại (`reservation` | `hold` | `ooo`) × tham chiếu nguồn (đơn/phân đoạn đơn, phiếu sửa chữa) × `active boolean`.
2. **Ràng buộc ở PostgreSQL**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ALTER TABLE room_occupancy ADD CONSTRAINT room_occupancy_no_overlap
     EXCLUDE USING gist (room_id WITH =, stay_range WITH &&) WHERE (active);
   ```
   → Hai giao dịch đồng thời ghi cùng căn/đêm: **một thành công, một nhận lỗi 23P01** → API trả `409 ROOM_UNAVAILABLE` với danh sách đêm bị trùng (tình huống S5). Không phụ thuộc mức isolation, không phụ thuộc client.
3. Trạng thái đơn (BR-301): `hold`, `confirmed`, `in_house` → dòng `active = true`; `checked_out` giữ `active = true` (lịch sử, không ảnh hưởng tương lai), `cancelled`, `no_show`, hold hết hạn → `active = false` **trong cùng giao dịch** đổi trạng thái. OOO (BR-804) là dòng loại `ooo` – tự động chặn rack, kiểm trùng và đẩy "hết phòng" lên kênh.
4. **Đổi phòng giữa kỳ / gia hạn** = đóng/tạo phân đoạn (segment) trong 1 giao dịch; ràng buộc tự kiểm.
5. **Đơn OTA về** (theo nhóm căn): server tự gán căn trống trong nhóm (ưu tiên theo quy tắc DOM); nếu không còn căn → tạo đơn trạng thái phụ `conflict` (không chèn vào `room_occupancy`), cảnh báo đỏ "Cần chú ý" + thông báo lễ tân/quản lý (BR-312). **Không từ chối im lặng.** (Tên trạng thái cờ xung đột chờ BA thống nhất trong `state-machines.md` – có thể là cờ `needs_relocation` thay vì trạng thái mới.)
6. **Khóa tồn theo nhóm cho kênh**: số phòng trống đẩy lên kênh = số căn trong nhóm không có dòng `active` giao khoảng ngày – tính từ chính bảng này, không có bảng đếm riêng (tránh lệch).
7. **Mức giờ trong ngày** (trả muộn 17:00 vs khách mới đến 14:00 cùng căn – BR-416, S6): constraint ở mức ngày không bắt được → kiểm ở tầng ứng dụng trong cùng giao dịch, khóa hàng căn bằng `SELECT … FROM room WHERE id = $1 FOR UPDATE`.
8. **Idempotency** cho mọi POST tạo đơn/giữ chỗ/thu tiền/nhận-trả phòng/đổi trạng thái từ PWA: header `Idempotency-Key` (UUID), bảng `idempotency_key(key, user_id, method, path, request_hash, response_status, response_body, created_at)` giữ 48 giờ; gửi lại cùng key + cùng body → trả lại response cũ; cùng key khác body → `422 IDEMPOTENCY_KEY_REUSED`.
9. **Sửa đơn đồng thời**: cột `version` (khóa lạc quan); PATCH/hành động phải gửi `If-Match: <version>`; lệch → **`412 VERSION_CONFLICT`** (khớp OpenAPI, coding-standards, BA – QA #3, BE-ARC-12); thiếu → `428 PRECONDITION_REQUIRED`.

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn |
|---|---|
| Kiểm trùng bằng SELECT rồi INSERT ở mức READ COMMITTED | Race condition giữa 2 lễ tân / lễ tân + webhook OTA |
| SERIALIZABLE cho mọi giao dịch đặt phòng | Đúng nhưng phải retry khi lỗi tuần tự hóa ở mọi chỗ; constraint rõ ràng và rẻ hơn |
| Bảng `inventory(room_type, date, count)` giảm dần | Hợp khách sạn lớn bán theo loại; OTTIMO quản lý từng căn → bảng đếm dễ lệch với gán căn thực tế |
| Khóa phân tán (Redis lock) | Không có Redis (ADR-003); khóa ngoài DB không atomic với dữ liệu |

## Hệ quả
- Tốt: PRD S1 "0 đặt trùng do hệ thống" được bảo đảm bởi DB, test được bằng test đồng thời (QA: 2 request song song → đúng 1 thành công).
- Phải chấp nhận: đơn OTA chưa gán căn không tồn tại – mọi đơn phải gán căn ngay (phù hợp quy mô 10 căn); đổi căn phải qua API đổi phòng (không sửa tay).

## Cập nhật Pha B (15/10/2026)
- Điểm 5 chốt theo BA (`state-machines.md` 1.3): **không** thêm trạng thái; đơn OTA không còn căn được tạo `confirmed` với `reservation.conflict_state = 'open'`, segment `room_id = NULL`, không chèn `room_occupancy`; xử lý bằng B7/B14 (`erd.md` mục 7). Câu "đơn OTA chưa gán căn không tồn tại" ở phần Hệ quả được thay bằng: chỉ đơn kênh OTA xung đột mới được tồn tại ở trạng thái chưa gán căn, và không nhận phòng được cho tới khi gán.
- Tên bảng chốt: `room_occupancy`, `reservation_segment`, `idempotency_key` (erd mục 4.5, 4.12).

## Cập nhật R1 bước 4 (16/10/2026)
- Constraint `room_occupancy_no_overlap` khai `DEFERRABLE INITIALLY IMMEDIATE`; chỉ `swapRoom` (đổi chéo căn 2 đơn) dùng `SET CONSTRAINTS … DEFERRED` (BE-ARC-08). Thêm `CHECK (NOT isempty(stay_range))`.
- Thứ tự khóa chống deadlock: đơn → các dòng `room` theo `room_id` tăng dần → `folio`. Sau `23P01`: rollback rồi truy vấn dựng `conflicts[]`/`suggestions[]`.
- Đơn OTA lễ tân nhập tay vào căn kín → `409` kèm gợi ý, lễ tân chọn hoặc lưu "chưa gán căn" rồi gán bằng `assignRoom` (B7a) – decision-log PO 15/10, US-018 AC5, US-139; đơn OTA tự động (R3) tự gán trong nhóm, nhóm cao hơn chỉ gợi ý (DOM).
- Thứ tự kiểm idempotency trước `If-Match` (OpenAPI info).
